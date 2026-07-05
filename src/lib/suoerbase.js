import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nfuqomxpnhdiwozfqnys.supabase.co'
const supabaseKey = 'sb_publishable__K5EOgSb8kgdC8JBzsNWtQ_-Ge6SrIp'

export const supabase = createClient(supabaseUrl, supabaseKey)
console.log('supabase', supabase)


export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    return { data, error }
}

export const register = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  return { data, error }
}

export const getLessons = async () => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')

  return { data, error }
}


export const addProgress = async (userId, lessonId) => {
  const { data, error } = await supabase
    .from('progress')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
    })

  return { data, error }
}


export const addNews = async ( title, description, userId,) => {
  const { data, error } = await supabase
    .from('news')
    .insert({
      title: title,
      description: description,
      user_id: userId,
    })

  return { data, error }
}

export const getNews = async () => {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};


export const deleteNews = async (id) => {
  const { error } = await supabase
    .from("news")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
  }
};


