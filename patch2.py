import re

path = 'frontend/src/components/restaurant/SettingsTab.tsx'
content = open(path, 'r', encoding='utf-8').read()

save_settings = """
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: userRest } = await supabase.from('restaurant_users').select('restaurant_id').eq('user_id', userData.user.id).single();
      if (userRest) {
        await supabase.from('restaurants').update({
          name: businessName,
          phone_number: phoneNumber,
          timezone: timezone,
          ai_instructions: greetingScript
        }).eq('id', userRest.restaurant_id);
      }
    }
    setIsSaving(false);
    
    // Instead of showToast, just alert for now since we don't have showToast defined in this snippet or we can keep it if it exists.
    // Wait, the original code had: showToast('... saved successfully.')
    // Let's assume it exists or we just use alert. Let's just use alert because I don't see showToast in the state, wait, it might be from a hook.
    // Wait, let's keep the original showToast if it exists!
    // But looking at the output, showToast is probably not a hook in the snippet, wait.
"""

# Let's see what is inside handleSaveSettings in the original file.
