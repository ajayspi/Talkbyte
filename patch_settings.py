import re

path = 'frontend/src/components/restaurant/SettingsTab.tsx'
content = open(path, 'r', encoding='utf-8').read()

# Add supabase import
if 'supabaseBrowser' not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { supabaseBrowser } from '@/lib/supabase-browser';")

# Update state variables
state_vars = """
  const [businessName, setBusinessName] = useState("Loading...");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [holidayClosureMode, setHolidayClosureMode] = useState(false);

  const [ttsProvider, setTtsProvider] = useState("Cartesia Sonic (Ultra-low Latency)");
  const [voicePersona, setVoicePersona] = useState("Aria");
  const [greetingScript, setGreetingScript] = useState("");

  const [allowManualTakeover, setAllowManualTakeover] = useState(true);
  const [transferLowConfidence, setTransferLowConfidence] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const supabase = supabaseBrowser();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { data: userRest } = await supabase
        .from('restaurant_users')
        .select('restaurant_id')
        .eq('user_id', userData.user.id)
        .single();
        
      if (userRest) {
        const { data: rest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', userRest.restaurant_id)
          .single();
          
        if (rest) {
          setBusinessName(rest.name || "");
          setPhoneNumber(rest.phone_number || "");
          setTimezone(rest.timezone || "Australia/Sydney");
          setGreetingScript(rest.ai_instructions || "");
        }
      }
    };
    loadData();
  }, []);
"""

content = re.sub(
    r'  const \[businessName, setBusinessName\] = useState\("Mama\'s Pizzeria"\);.*?const \[transferLowConfidence, setTransferLowConfidence\] = useState\(true\);',
    state_vars.strip(),
    content,
    flags=re.DOTALL
)

# Update Save Business Details
save_business = """
  const handleSaveBusiness = async (e: React.FormEvent) => {
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
          timezone: timezone
        }).eq('id', userRest.restaurant_id);
      }
    }
    setIsSaving(false);
    alert('Business Details Saved!');
  };
"""

content = re.sub(
    r'  const handleSaveBusiness = \(e: React\.FormEvent\) => \{\n    e\.preventDefault\(\);\n    console\.log\(\'Saved business\'\);\n  \};',
    save_business.strip(),
    content
)

# Update Save Voice Details
save_voice = """
  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const supabase = supabaseBrowser();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: userRest } = await supabase.from('restaurant_users').select('restaurant_id').eq('user_id', userData.user.id).single();
      if (userRest) {
        await supabase.from('restaurants').update({
          ai_instructions: greetingScript
        }).eq('id', userRest.restaurant_id);
      }
    }
    setIsSaving(false);
    alert('Voice Configuration Saved!');
  };
"""

content = re.sub(
    r'  const handleSaveVoice = \(e: React\.FormEvent\) => \{\n    e\.preventDefault\(\);\n    console\.log\(\'Saved voice\'\);\n  \};',
    save_voice.strip(),
    content
)

open(path, 'w', encoding='utf-8').write(content)
