export interface Tag {
  id: number
  name: string
}

export interface LayoutItem {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
}

export interface Layout {
  items: LayoutItem[]
  description?: string
}

export interface Frame {
  id: number
  title: string
  description?: string
  layout: string 
  is_published: boolean
  created_at: string
  tags: Tag[]
  admin_id?: number
  creator_id?: number
}

export interface FramePublic {
  id: number
  title: string
  description?: string
  layout: string
  tags: Tag[]
}

export interface Creator {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  portfolio_url?: string
  is_active: boolean
  created_at: string
  frames_count?: number
}

export interface CreatorPublic {
  id: number
  username: string
  first_name: string
  last_name: string
  portfolio_url?: string
  frames: FramePublic[]
}

export interface CreatorApplication {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  portfolio_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface LoginData {
  access_token: string
  token_type: string
  username: string
  role: 'admin' | 'creator' | 'user'
  first_name?: string
}

export interface BoardPublic {
  id: number
  title: string
  description?: string
  layout: string
  tags: Tag[]
  creator?: {
    username: string
    first_name: string
    last_name: string
  }
  created_at: string
}


export interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (data: LoginData) => void
}

export interface BoardPreviewProps {
  layout: string | Layout | null | undefined
}