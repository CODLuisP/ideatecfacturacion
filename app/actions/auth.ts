'use server'
 
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
 
export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const user = formData.get('user')
  const pass = formData.get('pass')
 
  if (user === 'admin' && pass === '123') {
    const cookieStore = await cookies()
    cookieStore.set('auth_user', 'admin', { secure: true })
    redirect('/ideatecfactus')
  } else {
    return { error: 'Credenciales inválidas' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_user')
  redirect('/login')
}
 