import { supabase } from "@/lib/supabaseClient";

type Section = "technical" | "soft" | "tools";

const CATEGORY_MAP: Record<Section, string> = {
    technical: "Technical Skills",
    soft: "Soft Skills",
    tools: "Tools & Frameworks",
};

let categoryCache: Record<string, number> | null = null;

async function getCategoryId(section: Section) {
    const categoryName = CATEGORY_MAP[section];
    if (!categoryCache) {
        const { data, error } = await supabase
            .from("skill_categories")
            .select('"categoryId", name')
            .eq("is_deleted", false);

        if (error) throw error;
        categoryCache = {};
        data.forEach((c) => {
            categoryCache![c.name] = c.categoryId;
        });
    }

    let categoryId = categoryCache[categoryName];

    if (!categoryId) {
        const { data, error } = await supabase
            .from("skill_categories")
            .insert({
                name: categoryName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        categoryCache[categoryName] = data.categoryId;
        categoryId = data.categoryId;
    }

    if (!categoryId) {
        throw new Error("Category not found");
    }
    return categoryId;
}

export async function fetchUserSkills(userId: number) {
    const { data, error } = await supabase
        .from("user_skills")
        .select(`
      skillId,
      skills (
        skillId,
        name,
        categoryId,
        skill_categories ( name )
      )
    `)
        .eq("userId", userId);

    if (error) throw error;

    return data.map((item: any) => ({
        skillId: item.skills.skillId,
        name: item.skills.name,
        category: item.skills.skill_categories.name,
    }));
}

export async function createUserSkill(
    userId: number,
    section: Section,
    skillName: string
) {
    const categoryId = await getCategoryId(section);
    const { data: skill, error: skillError } = await supabase
        .from("skills")
        .upsert(
            {
                categoryId,
                name: skillName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                onConflict: "categoryId,name",
            }
        )
        .select()
        .single();

    if (skillError) throw skillError;

    const { error: userSkillError } = await supabase
        .from("user_skills")
        .upsert(
            {
                userId,
                skillId: skill.skillId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                onConflict: "userId,skillId",
            }
        );

    if (userSkillError) throw userSkillError;

    return {
        skillId: skill.skillId,
        name: skill.name,
        category: CATEGORY_MAP[section],
    };
}

export async function deleteUserSkill(userId: number, skillId: number) {
    const { error } = await supabase
        .from("user_skills")
        .delete()
        .eq("userId", userId)
        .eq("skillId", skillId);

    if (error) throw error;
}
