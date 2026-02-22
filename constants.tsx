
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  CheckSquare, 
  Calendar, 
  Heart, 
  Settings,
  Plus,
  Trash2,
  Send,
  Search,
  ChevronRight,
  LogOut,
  Grid3X3,
  RotateCw,
  Upload,
  Sparkles,
  CheckCircle2,
  Edit2,
  X,
  UserPlus,
  Users2,
  Trash,
  Briefcase,
  FileText,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

export const COLORS = {
  primary: '#F4EFE6',
  accent: '#0F1A2E',
  detail: '#C6A75E'
};

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Guests: <Users size={20} />,
  Budget: <DollarSign size={20} />,
  Tasks: <CheckSquare size={20} />,
  Calendar: <Calendar size={20} />,
  Heart: <Heart size={20} />,
  Settings: <Settings size={20} />,
  Plus: <Plus size={16} />,
  Trash: <Trash size={16} />,
  Send: <Send size={18} />,
  Search: <Search size={18} />,
  Chevron: <ChevronRight size={18} />,
  LogOut: <LogOut size={18} />,
  Seating: <Grid3X3 size={20} />,
  Rotate: <RotateCw size={16} />,
  Upload: <Upload size={16} />,
  AI: <Sparkles size={20} />,
  Check: <CheckCircle2 size={16} />,
  Edit: <Edit2 size={16} />,
  Close: <X size={20} />,
  UserPlus: <UserPlus size={18} />,
  Group: <Users2 size={18} />,
  Vendors: <Briefcase size={20} />,
  Contract: <FileText size={16} />,
  Phone: <Phone size={14} />,
  Mail: <Mail size={14} />,
  Alert: <AlertCircle size={14} />
};

export const INITIAL_TASKS = [
  { id: '1', title: 'Reservar el Lugar', dueDate: '2025-06-01', completed: true, priority: 'High' as const },
  { id: '2', title: 'Contratar Fotógrafo', dueDate: '2026-07-15', completed: false, priority: 'High' as const },
  { id: '3', title: 'Comprar Vestido/Traje', dueDate: '2027-01-20', completed: false, priority: 'Medium' as const },
  { id: '4', title: 'Enviar Invitaciones', dueDate: '2027-03-01', completed: false, priority: 'High' as const },
];

export const INITIAL_GUESTS = [
  { 
    id: 'inv-1', 
    groupName: 'Pareja Thompson', 
    category: 'Amigo de Valentina', 
    members: [
      { id: 'm1', name: 'Alicia Thompson', ageCategory: 'Adulto' as const },
      { id: 'm2', name: 'John Thompson', ageCategory: 'Adulto' as const }
    ],
    status: 'Confirmado' as const, 
    certainty: 'Seguro' as const, 
    confirmation: 'Sí' as const 
  },
  { 
    id: 'inv-2', 
    groupName: 'Familia Miller', 
    category: 'Familia de Valentina', 
    members: [
      { id: 'm3', name: 'Roberto Miller', ageCategory: 'Adulto' as const },
      { id: 'm4', name: 'Ana Miller', ageCategory: 'Adulto' as const },
      { id: 'm5', name: 'Hijo Miller', ageCategory: 'Niño' as const }
    ],
    status: 'Invitación Enviada' as const, 
    certainty: 'Seguro' as const, 
    confirmation: 'No' as const 
  }
];

export const INITIAL_EXPENSES = [
  { id: '1', category: 'Lugar', item: 'El Gran Salón Real', estimated: 8000, actual: 7500, paid: true },
  { id: '2', category: 'Catering', item: 'Banquete de Gala', estimated: 5000, actual: 0, paid: false },
];

export const INITIAL_TABLES = [
  { id: 't1', name: 'Mesa Presidencial', type: 'round' as const, seats: 2, x: 200, y: 150, rotation: 0, assignedGuestIds: [] },
];

export const INITIAL_VENDORS = [
  {
    id: 'v1',
    name: 'Castillo de Chapultepec',
    category: 'Lugar',
    status: 'Contratado' as const,
    totalAmount: 12000,
    paidAmount: 5000,
    contactName: 'Elena Martínez',
    phone: '55 1234 5678',
    email: 'eventos@castillo.mx',
    contractSigned: true,
    dueDate: '2027-05-15',
    notes: 'Incluye iluminación básica y planta de luz.'
  },
  {
    id: 'v2',
    name: 'Gourmet Real',
    category: 'Catering',
    status: 'Cotización' as const,
    totalAmount: 8500,
    paidAmount: 0,
    contactName: 'Ricardo Sosa',
    phone: '55 8765 4321',
    email: 'chef@gourmetreal.com',
    contractSigned: false,
    dueDate: '2027-06-20',
    notes: 'Degustación programada para septiembre.'
  }
];

export const VENDOR_CATEGORIES = [
  'Lugar', 'Catering', 'Fotografía', 'Video', 'Música/DJ', 'Flores', 'Decoración', 'Vestido/Traje', 'Maquillaje/Peinado', 'Transporte', 'Invitaciones', 'Otros'
];

export const GUEST_CATEGORIES = [
  'Familia de Camilo', 'Familia de Valentina', 'Amigo de Camilo', 'Amigo de Valentina'
];
