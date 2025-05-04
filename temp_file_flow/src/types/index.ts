
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  owner: User;
  createdAt: string;
  updatedAt: string;
  sharedWith?: User[];
  isStarred?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  createdAt: string;
}
