import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pdkwvprjymusvezvnnyy.supabase.co'
const supabaseAnonKey = 'sb_publishable_3iJK3168rkMBCz2YQHJM2Q_HT7sUdIM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
