
export interface GuestMember {
  id: string;
  name: string;
  ageCategory: 'Adulto' | 'Niño';
  isUnknown?: boolean;
  tableId?: string;
}

export interface Guest {
  id: string;
  groupName: string;
  category: 'Familia de Camilo' | 'Familia de Valentina' | 'Amigo de Camilo' | 'Amigo de Valentina' | string;
  members: GuestMember[];
  status: 'Pendiente' | 'Invitación Enviada' | 'Confirmado' | 'Cancelado';
  confirmation: 'Sí' | 'No';
  certainty: 'Seguro' | 'Tal vez';
  dietary?: string;
  tableId?: string;
}

export interface Table {
  id: string;
  name: string;
  type: 'round' | 'square' | 'serpentine' | 'cake' | 'stage' | 'dancefloor';
  seats: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  assignedGuestIds: string[];
}

export interface BudgetItem {
  id: string;
  category: string;
  item: string;
  estimated: number;
  actual: number;
  paid: boolean;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: 'Pendiente' | 'Cotización' | 'Contratado' | 'Cancelado';
  totalAmount: number;
  paidAmount: number;
  contactName: string;
  phone: string;
  email: string;
  contractSigned: boolean;
  dueDate: string;
  notes: string;
  pdfUrl?: string;
  pdfName?: string;
  pdfPath?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  full_name: string;
  wedding_id: string | null;
  created_at?: string;
}

export interface WeddingData {
  partner1: string;
  partner2: string;
  date: string;
  budget: number;
  guests: Guest[];
  expenses: BudgetItem[];
  tasks: Task[];
  tables: Table[];
  vendors: Vendor[];
}
