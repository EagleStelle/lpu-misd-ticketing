import express from "express";
import { authMiddleware, globalAdminMiddleware } from "../middleware/auth.js";
import { supabase } from "../config/database.js";
import { logActivity } from "../services/activityService.js";

const router = express.Router();

const TYPES = ["department", "category"];

function normalizeName(raw) {
    return String(raw ?? "").trim();
}

/**
 * GET /api/ticket-options
 * Any authenticated user — active departments + categories for the submit form.
 * Returns { departments: [name...], categories: [name...] } sorted by sort_order.
 */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("ticket_options")
            .select("type, name, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });

        if (error) return res.status(400).json({ success: false, message: error.message });

        const departments = [];
        const categories = [];
        for (const row of data || []) {
            if (row.type === "department") departments.push(row.name);
            else if (row.type === "category") categories.push(row.name);
        }

        return res.status(200).json({ success: true, data: { departments, categories } });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * GET /api/ticket-options/manage
 * Global Admin only — full rows (including inactive) for the configure page.
 */
router.get("/manage", globalAdminMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("ticket_options")
            .select("id, type, name, sort_order, is_active, created_at")
            .order("type", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });

        if (error) return res.status(400).json({ success: false, message: error.message });

        return res.status(200).json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * POST /api/ticket-options
 * Global Admin only — add a department or category.
 * Body: { type, name }
 */
router.post("/", globalAdminMiddleware, async (req, res) => {
    try {
        const type = String(req.body.type ?? "").toLowerCase();
        const name = normalizeName(req.body.name);

        if (!TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: "type must be 'department' or 'category'" });
        }
        if (!name) {
            return res.status(400).json({ success: false, message: "name is required" });
        }

        // Duplicate check (case-insensitive) against the same type
        const { data: existing } = await supabase
            .from("ticket_options")
            .select("id")
            .eq("type", type)
            .ilike("name", name)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, message: `That ${type} already exists` });
        }

        // Place new option at the end
        const { data: maxRow } = await supabase
            .from("ticket_options")
            .select("sort_order")
            .eq("type", type)
            .order("sort_order", { ascending: false })
            .limit(1);
        const nextSort = (maxRow?.[0]?.sort_order ?? 0) + 1;

        const { data, error } = await supabase
            .from("ticket_options")
            .insert([{ type, name, sort_order: nextSort, is_active: true }])
            .select("id, type, name, sort_order, is_active, created_at");

        if (error) return res.status(400).json({ success: false, message: error.message });

        const created = data[0];
        logActivity({
            adminId: req.user?.id || req.user?.sub,
            actionType: "ADMIN_CONFIG_ADDED",
            targetId: created.id,
            targetLabel: `${created.name} ${type}`,
            metadata: { type, name: created.name },
        });

        return res.status(201).json({ success: true, data: created });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * PATCH /api/ticket-options/reorder
 * Global Admin only — persist a new display order for one type.
 * Body: { type, orderedIds: [id, ...] }
 */
router.patch("/reorder", globalAdminMiddleware, async (req, res) => {
    try {
        const type = String(req.body.type ?? "").toLowerCase();
        const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds : null;

        if (!TYPES.includes(type)) {
            return res.status(400).json({ success: false, message: "type must be 'department' or 'category'" });
        }
        if (!orderedIds || orderedIds.length === 0) {
            return res.status(400).json({ success: false, message: "orderedIds is required" });
        }

        // Assign sort_order by array position, scoped to the given type.
        await Promise.all(
            orderedIds.map((id, index) =>
                supabase
                    .from("ticket_options")
                    .update({ sort_order: index + 1 })
                    .eq("id", id)
                    .eq("type", type),
            ),
        );

        return res.status(200).json({ success: true });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * PATCH /api/ticket-options/:id
 * Global Admin only — rename or enable/disable an option.
 * Body: { name?, isActive? }
 */
router.patch("/:id", globalAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: found, error: findErr } = await supabase
            .from("ticket_options")
            .select("id, type, name, is_active")
            .eq("id", id)
            .limit(1);

        if (findErr) return res.status(400).json({ success: false, message: findErr.message });
        if (!found || found.length === 0) {
            return res.status(404).json({ success: false, message: "Option not found" });
        }
        const current = found[0];

        const updates = {};

        if (req.body.name !== undefined) {
            const name = normalizeName(req.body.name);
            if (!name) return res.status(400).json({ success: false, message: "name cannot be empty" });

            const { data: dup } = await supabase
                .from("ticket_options")
                .select("id")
                .eq("type", current.type)
                .ilike("name", name)
                .neq("id", id)
                .limit(1);
            if (dup && dup.length > 0) {
                return res.status(409).json({ success: false, message: `That ${current.type} already exists` });
            }
            updates.name = name;
        }

        if (req.body.isActive !== undefined) {
            updates.is_active = Boolean(req.body.isActive);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        const { data, error } = await supabase
            .from("ticket_options")
            .update(updates)
            .eq("id", id)
            .select("id, type, name, sort_order, is_active, created_at");

        if (error) return res.status(400).json({ success: false, message: error.message });

        const updated = data[0];
        let verb = "Edited";
        if (req.body.isActive !== undefined && req.body.name === undefined) {
            verb = updates.is_active ? "Enabled" : "Disabled";
        }
        logActivity({
            adminId: req.user?.id || req.user?.sub,
            actionType: "ADMIN_CONFIG_EDITED",
            targetId: updated.id,
            targetLabel: `${updated.name} ${updated.type}`,
            metadata: { type: updated.type, name: updated.name, verb },
        });

        return res.status(200).json({ success: true, data: updated });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * DELETE /api/ticket-options/:id
 * Global Admin only — remove an option.
 */
router.delete("/:id", globalAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: found, error: findErr } = await supabase
            .from("ticket_options")
            .select("id, type, name")
            .eq("id", id)
            .limit(1);

        if (findErr) return res.status(400).json({ success: false, message: findErr.message });
        if (!found || found.length === 0) {
            return res.status(404).json({ success: false, message: "Option not found" });
        }
        const target = found[0];

        const { error } = await supabase.from("ticket_options").delete().eq("id", id);
        if (error) return res.status(400).json({ success: false, message: error.message });

        logActivity({
            adminId: req.user?.id || req.user?.sub,
            actionType: "ADMIN_CONFIG_DELETED",
            targetId: target.id,
            targetLabel: `${target.name} ${target.type}`,
            metadata: { type: target.type, name: target.name },
        });

        return res.status(200).json({ success: true, data: target });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
