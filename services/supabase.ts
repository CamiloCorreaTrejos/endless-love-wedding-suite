
import { supabase } from "../src/lib/supabaseClient";
import { Guest, Table, BudgetItem, Task, Vendor, GuestMember, NotificationItem } from "../types";

export { supabase };

export const isSupabaseConfigured = () => !!supabase;

// --- Mapping Functions (Row to UI) ---

export const mapGuestMemberRowToUI = (row: any): GuestMember => ({
  id: row.id,
  name: row.name ?? 'Invitado',
  ageCategory: row.age_category ?? 'Adulto',
  isUnknown: row.is_unknown ?? false,
  tableId: row.table_id ?? undefined,
  attending: row.attending ?? undefined,
  dietaryRestrictions: row.dietary_restrictions ?? '',
  rsvpNotes: row.rsvp_notes ?? '',
});

export const mapGuestRowToUI = (row: any): Guest => ({
  id: row.id,
  groupName: row.group_name ?? '',
  category: row.category ?? 'Familia de Camilo',
  status: row.status ?? 'Pendiente',
  certainty: row.certainty ?? 'Seguro',
  confirmation: row.confirmation ?? 'No',
  dietary: row.dietary_notes ?? '',
  members: (row.guest_members ?? []).map(mapGuestMemberRowToUI),
  maxGuests: row.max_guests ?? 1,
  rsvpCode: row.rsvp_code ?? '',
  rsvpStatus: row.rsvp_status ?? 'pendiente',
  rsvpSubmittedAt: row.rsvp_submitted_at ?? undefined,
  rsvpClosed: row.rsvp_closed ?? false,
});

export const mapTableRowToUI = (row: any): Table => ({
  id: row.id,
  name: row.name ?? '',
  type: row.type ?? 'round',
  seats: row.seats ?? 8,
  x: row.x_position ?? 0,
  y: row.y_position ?? 0,
  width: row.width ?? 100,
  height: row.height ?? 100,
  rotation: row.rotation ?? 0,
  assignedGuestIds: [], // Will be populated by getTablesByWedding
});

export const mapVendorRowToUI = (row: any): Vendor => ({
  id: row.id,
  name: row.name ?? '',
  category: row.category ?? '',
  status: row.status ?? 'Pendiente',
  totalAmount: row.total_amount ?? 0,
  paidAmount: row.paid_amount ?? 0,
  contactName: row.contact_name ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  contractSigned: row.contract_signed ?? false,
  dueDate: row.due_date ?? '',
  notes: row.notes ?? '',
  pdfUrl: row.pdf_url ?? undefined,
  pdfName: row.pdf_name ?? undefined,
  pdfPath: row.pdf_path ?? undefined,
});

export const mapBudgetItemRowToUI = (row: any): BudgetItem => ({
  id: row.id,
  category: row.category ?? '',
  item: row.item_name ?? '',
  estimated: row.estimated_amount ?? 0,
  actual: row.actual_amount ?? 0,
  paid: row.is_paid ?? false,
});

export const mapTaskRowToUI = (row: any): Task => ({
  id: row.id,
  title: row.title ?? '',
  dueDate: row.due_date ?? '',
  completed: row.is_completed ?? false,
  priority: row.priority ?? 'Medium',
});

// --- Mapping Functions (UI to Payload/Patch) ---

const normalizeValue = (val: any) => (val === undefined || val === '' ? null : val);

export const mapGuestUIToInsertPayload = (guest: Omit<Guest, 'id'>, weddingId: string) => ({
  wedding_id: weddingId,
  group_name: normalizeValue(guest.groupName),
  category: normalizeValue(guest.category),
  status: normalizeValue(guest.status),
  certainty: normalizeValue(guest.certainty),
  confirmation: normalizeValue(guest.confirmation),
  dietary_notes: normalizeValue(guest.dietary),
  max_guests: guest.maxGuests ?? 1,
  rsvp_code: normalizeValue(guest.rsvpCode),
  rsvp_status: guest.rsvpStatus ?? 'pendiente',
  rsvp_closed: guest.rsvpClosed ?? false,
});

export const mapGuestUIToUpdatePatch = (updates: Partial<Guest>) => {
  const patch: any = {};
  if (updates.groupName !== undefined) patch.group_name = normalizeValue(updates.groupName);
  if (updates.category !== undefined) patch.category = normalizeValue(updates.category);
  if (updates.status !== undefined) patch.status = normalizeValue(updates.status);
  if (updates.certainty !== undefined) patch.certainty = normalizeValue(updates.certainty);
  if (updates.confirmation !== undefined) patch.confirmation = normalizeValue(updates.confirmation);
  if (updates.dietary !== undefined) patch.dietary_notes = normalizeValue(updates.dietary);
  if (updates.maxGuests !== undefined) patch.max_guests = updates.maxGuests;
  if (updates.rsvpCode !== undefined) patch.rsvp_code = normalizeValue(updates.rsvpCode);
  if (updates.rsvpStatus !== undefined) patch.rsvp_status = updates.rsvpStatus;
  if (updates.rsvpClosed !== undefined) patch.rsvp_closed = updates.rsvpClosed;
  if (updates.rsvpSubmittedAt !== undefined) patch.rsvp_submitted_at = updates.rsvpSubmittedAt;
  return patch;
};

export const mapGuestMemberUIToInsertPayload = (member: Omit<GuestMember, 'id'>, guestId: string) => ({
  guest_id: guestId,
  name: normalizeValue(member.name),
  age_category: normalizeValue(member.ageCategory),
  is_unknown: member.isUnknown ?? false,
  table_id: normalizeValue(member.tableId),
  attending: member.attending ?? null,
  dietary_restrictions: normalizeValue(member.dietaryRestrictions),
  rsvp_notes: normalizeValue(member.rsvpNotes),
});

export const mapTableUIToInsertPayload = (table: Omit<Table, 'id'>, weddingId: string) => ({
  wedding_id: weddingId,
  name: table.name,
  type: table.type,
  seats: table.seats,
  x_position: table.x,
  y_position: table.y,
  width: table.width,
  height: table.height,
  rotation: table.rotation,
});

export const mapTableUIToUpdatePatch = (updates: Partial<Table>) => {
  const patch: any = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.type !== undefined) patch.type = updates.type;
  if (updates.seats !== undefined) patch.seats = updates.seats;
  if (updates.x !== undefined) patch.x_position = updates.x;
  if (updates.y !== undefined) patch.y_position = updates.y;
  if (updates.width !== undefined) patch.width = updates.width;
  if (updates.height !== undefined) patch.height = updates.height;
  if (updates.rotation !== undefined) patch.rotation = updates.rotation;
  return patch;
};

export const mapVendorUIToInsertPayload = (vendor: Omit<Vendor, 'id'>, weddingId: string) => ({
  wedding_id: weddingId,
  name: normalizeValue(vendor.name),
  category: normalizeValue(vendor.category),
  status: normalizeValue(vendor.status),
  total_amount: vendor.totalAmount ?? 0,
  paid_amount: vendor.paidAmount ?? 0,
  contact_name: normalizeValue(vendor.contactName),
  phone: normalizeValue(vendor.phone),
  email: normalizeValue(vendor.email),
  contract_signed: vendor.contractSigned ?? false,
  due_date: normalizeValue(vendor.dueDate),
  notes: normalizeValue(vendor.notes),
  pdf_url: normalizeValue(vendor.pdfUrl),
  pdf_name: normalizeValue(vendor.pdfName),
  pdf_path: normalizeValue(vendor.pdfPath),
});

export const mapVendorUIToUpdatePatch = (updates: Partial<Vendor>) => {
  const patch: any = {};
  if (updates.name !== undefined) patch.name = normalizeValue(updates.name);
  if (updates.category !== undefined) patch.category = normalizeValue(updates.category);
  if (updates.status !== undefined) patch.status = normalizeValue(updates.status);
  if (updates.totalAmount !== undefined) patch.total_amount = updates.totalAmount;
  if (updates.paidAmount !== undefined) patch.paid_amount = updates.paidAmount;
  if (updates.contactName !== undefined) patch.contact_name = normalizeValue(updates.contactName);
  if (updates.phone !== undefined) patch.phone = normalizeValue(updates.phone);
  if (updates.email !== undefined) patch.email = normalizeValue(updates.email);
  if (updates.contractSigned !== undefined) patch.contract_signed = updates.contractSigned;
  if (updates.dueDate !== undefined) patch.due_date = normalizeValue(updates.dueDate);
  if (updates.notes !== undefined) patch.notes = normalizeValue(updates.notes);
  if (updates.pdfUrl !== undefined) patch.pdf_url = normalizeValue(updates.pdfUrl);
  if (updates.pdfName !== undefined) patch.pdf_name = normalizeValue(updates.pdfName);
  if (updates.pdfPath !== undefined) patch.pdf_path = normalizeValue(updates.pdfPath);
  return patch;
};

export const mapBudgetItemUIToInsertPayload = (item: Omit<BudgetItem, 'id'>, weddingId: string) => ({
  wedding_id: weddingId,
  category: normalizeValue(item.category),
  item_name: normalizeValue(item.item),
  estimated_amount: item.estimated ?? 0,
  actual_amount: item.actual ?? 0,
  is_paid: item.paid ?? false,
});

export const mapBudgetItemUIToUpdatePatch = (updates: Partial<BudgetItem>) => {
  const patch: any = {};
  if (updates.category !== undefined) patch.category = normalizeValue(updates.category);
  if (updates.item !== undefined) patch.item_name = normalizeValue(updates.item);
  if (updates.estimated !== undefined) patch.estimated_amount = updates.estimated;
  if (updates.actual !== undefined) patch.actual_amount = updates.actual;
  if (updates.paid !== undefined) patch.is_paid = updates.paid;
  return patch;
};

export const mapTaskUIToInsertPayload = (task: Omit<Task, 'id'>, weddingId: string) => ({
  wedding_id: weddingId,
  title: normalizeValue(task.title),
  due_date: normalizeValue(task.dueDate),
  is_completed: task.completed ?? false,
  priority: normalizeValue(task.priority) || 'Medium',
});

export const mapTaskUIToUpdatePatch = (updates: Partial<Task>) => {
  const patch: any = {};
  if (updates.title !== undefined) patch.title = normalizeValue(updates.title);
  if (updates.dueDate !== undefined) patch.due_date = normalizeValue(updates.dueDate);
  if (updates.completed !== undefined) patch.is_completed = updates.completed;
  if (updates.priority !== undefined) patch.priority = normalizeValue(updates.priority);
  return patch;
};

// --- CRUD Helpers ---

const checkSupabase = () => {
  if (!supabase) throw new Error("Supabase not configured");
};

const checkWeddingId = (weddingId: string) => {
  if (!weddingId) throw new Error("Missing weddingId");
};

// GUESTS
export const getGuestsByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_GUESTS_START", { weddingId });
  const { data, error } = await supabase!
    .from('guests')
    .select('*, guest_members(*)')
    .eq('wedding_id', weddingId);
  if (error) {
    console.error("GET_GUESTS_ERROR", error);
    return { data: [], error };
  }
  const mapped = data.map(mapGuestRowToUI);
  console.log("GET_GUESTS_OK", { count: mapped.length });
  return { data: mapped, error: null };
};

export const createGuest = async (guest: Omit<Guest, 'id'>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_GUEST_START", { weddingId, payload: guest });
  try {
    const { members = [], ...guestData } = guest;
    
    // RSVP defaults
    const rsvpCode = generateRsvpCode();
    const maxGuests = members.length > 0 ? members.length : (guest.maxGuests || 1);
    
    const payloadGuest = {
      ...mapGuestUIToInsertPayload(guestData as any, weddingId),
      rsvp_code: rsvpCode,
      max_guests: maxGuests,
      rsvp_status: 'pendiente',
      rsvp_closed: false
    };
    
    const { data: newGuest, error: guestError } = await supabase!
      .from('guests')
      .insert(payloadGuest)
      .select()
      .single();

    if (guestError || !newGuest) throw guestError || new Error("Guest insert failed");

    const membersToInsert = members.map(m => mapGuestMemberUIToInsertPayload(m, newGuest.id));
    if (membersToInsert.length > 0) {
      const { error: membersError } = await supabase!
        .from('guest_members')
        .insert(membersToInsert);
      
      if (membersError) {
        await supabase!.from('guests').delete().eq('id', newGuest.id);
        throw membersError;
      }
    }

    console.log("CREATE_GUEST_OK", { id: newGuest.id });
    return { data: newGuest, error: null };
  } catch (error: any) {
    console.error("CREATE_GUEST_ERROR", error);
    return { data: null, error };
  }
};

export const updateGuest = async (guestId: string, updates: Partial<Guest>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_GUEST_START", { guestId, weddingId, updates });
  try {
    const { members, ...guestData } = updates;
    const patch = mapGuestUIToUpdatePatch(guestData);

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase!
        .from('guests')
        .update(patch)
        .eq('id', guestId)
        .eq('wedding_id', weddingId);
      if (error) throw error;
    }

    if (members) {
      // 1. Fetch current members to identify what to delete
      const { data: currentMembers, error: fetchError } = await supabase!
        .from('guest_members')
        .select('id')
        .eq('guest_id', guestId);
      
      if (fetchError) throw fetchError;
      
      const currentIds = new Set((currentMembers || []).map(m => m.id));
      const incomingIds = new Set(members.filter(m => m.id && m.id.length > 10).map(m => m.id)); // Simple check for real UUIDs
      
      // 2. Delete members that are not in the incoming list
      const toDelete = [...currentIds].filter(id => !incomingIds.has(id));
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase!
          .from('guest_members')
          .delete()
          .in('id', toDelete)
          .eq('guest_id', guestId);
        if (deleteError) throw deleteError;
      }

      // 3. Upsert incoming members
      for (const m of members) {
        const isNew = !m.id || m.id.length < 10; // Simple check for temporary IDs
        const mPayload = mapGuestMemberUIToInsertPayload(m as any, guestId);
        
        if (isNew) {
          const { error: insertError } = await supabase!
            .from('guest_members')
            .insert(mPayload);
          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase!
            .from('guest_members')
            .update({
              name: mPayload.name,
              age_category: mPayload.age_category,
              is_unknown: mPayload.is_unknown,
              table_id: mPayload.table_id,
              attending: mPayload.attending,
              dietary_restrictions: mPayload.dietary_restrictions,
              rsvp_notes: mPayload.rsvp_notes
            })
            .eq('id', m.id)
            .eq('guest_id', guestId);
          if (updateError) throw updateError;
        }
      }
    }

    console.log("UPDATE_GUEST_OK");
    return { error: null };
  } catch (error: any) {
    console.error("UPDATE_GUEST_ERROR", error);
    return { error };
  }
};

export const deleteGuest = async (guestId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DELETE_GUEST_START", { guestId, weddingId });
  const { error } = await supabase!
    .from('guests')
    .delete()
    .eq('id', guestId)
    .eq('wedding_id', weddingId);
  if (error) console.error("DELETE_GUEST_ERROR", error);
  else console.log("DELETE_GUEST_OK");
  return { error };
};

// TABLES
export const getTablesByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_TABLES_START", { weddingId });
  
  // 1. Fetch tables
  const { data: tablesData, error: tablesError } = await supabase!
    .from('tables')
    .select('id, name, type, seats, x_position, y_position, width, height, rotation')
    .eq('wedding_id', weddingId);
    
  if (tablesError) {
    console.error("GET_TABLES_ERROR", tablesError);
    return { data: [], error: tablesError };
  }

  if (!tablesData || tablesData.length === 0) {
    return { data: [], error: null };
  }

  const tableIds = tablesData.map(t => t.id);

  // 2. Fetch assignments from guest_members
  const { data: membersData, error: membersError } = await supabase!
    .from('guest_members')
    .select('id, table_id')
    .in('table_id', tableIds);

  if (membersError) {
    console.error("GET_TABLE_ASSIGNMENTS_ERROR", membersError);
    // Continue with empty assignments if this fails
  }

  // 3. Build map of table_id -> [member_id]
  const assignmentMap: Record<string, string[]> = {};
  (membersData || []).forEach(m => {
    if (m.table_id) {
      if (!assignmentMap[m.table_id]) assignmentMap[m.table_id] = [];
      assignmentMap[m.table_id].push(m.id);
    }
  });

  // 4. Map to UI model
  const mapped = tablesData.map(row => {
    const table = mapTableRowToUI(row);
    table.assignedGuestIds = assignmentMap[table.id] || [];
    return table;
  });

  console.log("GET_TABLES_OK", { count: mapped.length });
  return { data: mapped, error: null };
};

export const createTable = async (table: Omit<Table, 'id'>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_TABLE_START", { weddingId, payload: table });
  const payload = mapTableUIToInsertPayload(table, weddingId);
  const { data, error } = await supabase!.from('tables').insert([payload]).select().single();
  if (error) console.error("CREATE_TABLE_ERROR", error);
  else console.log("CREATE_TABLE_OK", { id: data.id });
  return { data, error };
};

export const updateTable = async (tableId: string, updates: Partial<Table>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_TABLE_START", { tableId, weddingId, updates });
  const patch = mapTableUIToUpdatePatch(updates);
  const { error } = await supabase!.from('tables').update(patch).eq('id', tableId).eq('wedding_id', weddingId);
  if (error) console.error("UPDATE_TABLE_ERROR", error);
  else console.log("UPDATE_TABLE_OK");
  return { error };
};

export const assignGuestMemberToTable = async (memberId: string, tableId: string | null) => {
  checkSupabase();
  console.log("ASSIGN_MEMBER_TO_TABLE_START", { memberId, tableId });
  const { error } = await supabase!
    .from('guest_members')
    .update({ table_id: tableId })
    .eq('id', memberId);
    
  if (error) console.error("ASSIGN_MEMBER_TO_TABLE_ERROR", error);
  else console.log("ASSIGN_MEMBER_TO_TABLE_OK");
  return { error };
};

export const deleteTable = async (tableId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DELETE_TABLE_START", { tableId, weddingId });
  const { error } = await supabase!.from('tables').delete().eq('id', tableId).eq('wedding_id', weddingId);
  if (error) console.error("DELETE_TABLE_ERROR", error);
  else console.log("DELETE_TABLE_OK");
  return { error };
};

// VENDORS
export const getVendorsByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_VENDORS_START", { weddingId });
  const { data, error } = await supabase!.from('vendors').select('*').eq('wedding_id', weddingId);
  if (error) {
    console.error("GET_VENDORS_ERROR", error);
    return { data: [], error };
  }
  const mapped = data.map(mapVendorRowToUI);
  console.log("GET_VENDORS_OK", { count: mapped.length });
  return { data: mapped, error: null };
};

export const uploadVendorPdf = async (file: File, weddingId: string, vendorId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Invalid file or empty file");
  }

  console.log("UPLOAD_VENDOR_PDF_START", { 
    vendorId, 
    weddingId, 
    fileName: file.name, 
    size: file.size,
    type: file.type 
  });
  
  try {
    const timestamp = Date.now();
    // Sanitize filename: lower, replace spaces with _, remove special chars
    const safeName = file.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9._]/gi, '');
      
    const path = `${weddingId}/vendors/${vendorId}/${timestamp}_${safeName}`;
    
    const { data, error } = await supabase!.storage
      .from('vendor-files')
      .upload(path, file, { 
        upsert: true,
        contentType: file.type 
      });
      
    if (error) {
      console.error("UPLOAD_VENDOR_PDF_ERROR", error);
      throw error;
    }
    
    const { data: publicData } = supabase!.storage
      .from('vendor-files')
      .getPublicUrl(path);
      
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      throw new Error("Failed to generate public URL");
    }
      
    console.log("UPLOAD_VENDOR_PDF_OK", { vendorId, path, publicUrl });
    return { 
      pdf_url: publicUrl, 
      pdf_name: file.name, 
      pdf_path: path,
      error: null 
    };
  } catch (error: any) {
    console.error("UPLOAD_VENDOR_PDF_ERROR_FULL", error);
    return { pdf_url: null, pdf_name: null, pdf_path: null, error };
  }
};

export const createVendor = async (vendor: Omit<Vendor, 'id'> & { pdfFile?: File }, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_VENDOR_START", { weddingId, payload: vendor });
  
  try {
    const { pdfFile, ...vendorData } = vendor;
    
    // 1. Insert without PDF first
    const payload = mapVendorUIToInsertPayload(vendorData as any, weddingId);
    const { data: newVendor, error: insertError } = await supabase!
      .from('vendors')
      .insert([payload])
      .select()
      .single();
      
    if (insertError || !newVendor) throw insertError || new Error("Insert failed");

    let finalVendor = mapVendorRowToUI(newVendor);

    // 2. Upload PDF if exists
    if (pdfFile) {
      const uploadResult = await uploadVendorPdf(pdfFile, weddingId, newVendor.id);
      if (!uploadResult.error && uploadResult.pdf_url) {
        const { error: updateError } = await updateVendor(newVendor.id, {
          pdfUrl: uploadResult.pdf_url,
          pdfName: uploadResult.pdf_name,
          pdfPath: uploadResult.pdf_path
        }, weddingId);
        
        if (!updateError) {
          finalVendor.pdfUrl = uploadResult.pdf_url;
          finalVendor.pdfName = uploadResult.pdf_name;
          finalVendor.pdfPath = uploadResult.pdf_path;
        }
      }
    }

    console.log("CREATE_VENDOR_OK", { id: finalVendor.id, hasPdf: !!finalVendor.pdfUrl });
    return { data: finalVendor, error: null };
  } catch (error: any) {
    console.error("CREATE_VENDOR_ERROR", error);
    return { data: null, error };
  }
};

export const updateVendor = async (vendorId: string, updates: Partial<Vendor> & { pdfFile?: File }, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_VENDOR_START", { vendorId, weddingId, updates });
  
  try {
    const { pdfFile, ...vendorUpdates } = updates;
    let finalUpdates = { ...vendorUpdates };

    // 1. Handle new PDF if provided
    if (pdfFile) {
      const uploadResult = await uploadVendorPdf(pdfFile, weddingId, vendorId);
      if (!uploadResult.error && uploadResult.pdf_url) {
        finalUpdates.pdfUrl = uploadResult.pdf_url;
        finalUpdates.pdfName = uploadResult.pdf_name;
        finalUpdates.pdfPath = uploadResult.pdf_path;
      }
    }

    // 2. Apply updates
    const patch = mapVendorUIToUpdatePatch(finalUpdates);
    const { error } = await supabase!
      .from('vendors')
      .update(patch)
      .eq('id', vendorId)
      .eq('wedding_id', weddingId);
      
    if (error) throw error;

    console.log("UPDATE_VENDOR_OK", { vendorId, hasPdf: !!finalUpdates.pdfUrl });
    return { error: null };
  } catch (error: any) {
    console.error("UPDATE_VENDOR_ERROR", error);
    return { error };
  }
};

export const deleteVendor = async (vendorId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DELETE_VENDOR_START", { vendorId, weddingId });
  const { error } = await supabase!.from('vendors').delete().eq('id', vendorId).eq('wedding_id', weddingId);
  if (error) console.error("DELETE_VENDOR_ERROR", error);
  else console.log("DELETE_VENDOR_OK");
  return { error };
};

// BUDGET
export const getBudgetByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_BUDGET_START", { weddingId });
  const { data, error } = await supabase!.from('budget_items').select('*').eq('wedding_id', weddingId);
  if (error) {
    console.error("GET_BUDGET_ERROR", error);
    return { data: [], error };
  }
  const mapped = data.map(mapBudgetItemRowToUI);
  console.log("GET_BUDGET_OK", { count: mapped.length });
  return { data: mapped, error: null };
};

export const createBudgetItem = async (item: Omit<BudgetItem, 'id'>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_BUDGET_ITEM_START", { weddingId, payload: item });
  const payload = mapBudgetItemUIToInsertPayload(item, weddingId);
  const { data, error } = await supabase!.from('budget_items').insert([payload]).select().single();
  if (error) console.error("CREATE_BUDGET_ITEM_ERROR", error);
  else console.log("CREATE_BUDGET_ITEM_OK", { id: data.id });
  return { data, error };
};

export const updateBudgetItem = async (itemId: string, updates: Partial<BudgetItem>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_BUDGET_ITEM_START", { itemId, weddingId, updates });
  const patch = mapBudgetItemUIToUpdatePatch(updates);
  const { error } = await supabase!.from('budget_items').update(patch).eq('id', itemId).eq('wedding_id', weddingId);
  if (error) console.error("UPDATE_BUDGET_ITEM_ERROR", error);
  else console.log("UPDATE_BUDGET_ITEM_OK");
  return { error };
};

export const deleteBudgetItem = async (itemId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DELETE_BUDGET_ITEM_START", { itemId, weddingId });
  const { error } = await supabase!.from('budget_items').delete().eq('id', itemId).eq('wedding_id', weddingId);
  if (error) console.error("DELETE_BUDGET_ITEM_ERROR", error);
  else console.log("DELETE_BUDGET_ITEM_OK");
  return { error };
};

// TASKS
export const getTasksByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_TASKS_START", { weddingId });
  const { data, error } = await supabase!.from('tasks').select('*').eq('wedding_id', weddingId);
  if (error) {
    console.error("GET_TASKS_ERROR", error);
    return { data: [], error };
  }
  const mapped = data.map(mapTaskRowToUI);
  console.log("GET_TASKS_OK", { count: mapped.length });
  return { data: mapped, error: null };
};

export const createTask = async (task: Omit<Task, 'id'>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_TASK_START", { weddingId, payload: task });
  const payload = mapTaskUIToInsertPayload(task, weddingId);
  const { data, error } = await supabase!.from('tasks').insert([payload]).select().single();
  if (error) console.error("CREATE_TASK_ERROR", error);
  else console.log("CREATE_TASK_OK", { id: data.id });
  return { data, error };
};

export const updateTask = async (taskId: string, updates: Partial<Task>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_TASK_START", { taskId, weddingId, updates });
  const patch = mapTaskUIToUpdatePatch(updates);
  const { error } = await supabase!.from('tasks').update(patch).eq('id', taskId).eq('wedding_id', weddingId);
  if (error) console.error("UPDATE_TASK_ERROR", error);
  else console.log("UPDATE_TASK_OK");
  return { error };
};

// --- RSVP Helpers ---

export const generateRsvpCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const updateGuestRsvpFields = async (guestId: string, weddingId: string, patch: { maxGuests?: number, rsvpClosed?: boolean, rsvpStatus?: string }) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_RSVP_GROUP_START", { guestId, weddingId, patch });
  
  const dbPatch: any = {};
  if (patch.maxGuests !== undefined) dbPatch.max_guests = patch.maxGuests;
  if (patch.rsvpClosed !== undefined) dbPatch.rsvp_closed = patch.rsvpClosed;
  if (patch.rsvpStatus !== undefined) dbPatch.rsvp_status = patch.rsvpStatus;

  try {
    const { error } = await supabase!
      .from('guests')
      .update(dbPatch)
      .eq('id', guestId)
      .eq('wedding_id', weddingId);
    
    if (error) throw error;
    console.log("UPDATE_RSVP_GROUP_OK");
    return { error: null };
  } catch (error: any) {
    console.error("UPDATE_RSVP_GROUP_ERROR", error);
    return { error };
  }
};

export const ensureGuestHasRsvpCode = async (guestId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  
  try {
    const { data, error } = await supabase!
      .from('guests')
      .select('rsvp_code')
      .eq('id', guestId)
      .single();
    
    if (error) throw error;
    
    if (data.rsvp_code) return data.rsvp_code;
    
    // Generate and save
    let code = generateRsvpCode();
    let attempts = 0;
    let success = false;
    
    while (attempts < 5 && !success) {
      const { error: updateError } = await supabase!
        .from('guests')
        .update({ rsvp_code: code })
        .eq('id', guestId);
      
      if (!updateError) {
        success = true;
      } else {
        code = generateRsvpCode();
        attempts++;
      }
    }
    
    return success ? code : null;
  } catch (error) {
    console.error("ENSURE_RSVP_CODE_ERROR", error);
    return null;
  }
};

export const getRsvpDashboardByWedding = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_RSVP_DASHBOARD_START", { weddingId });
  
  try {
    const { data: guests, error: guestsError } = await supabase!
      .from('guests')
      .select('id, group_name, category, max_guests, rsvp_code, rsvp_status, rsvp_closed, rsvp_submitted_at, guest_members(id, guest_id, name, attending, dietary_restrictions)')
      .eq('wedding_id', weddingId);
    
    if (guestsError) throw guestsError;

    const metrics = {
      totalCupos: 0,
      totalConfirmados: 0,
      totalRechazados: 0,
      pendientes: 0,
      gruposConfirmados: 0,
      gruposParciales: 0,
      gruposCerrados: 0
    };

    const mappedGuests = guests.map(g => {
      const members = g.guest_members || [];
      const attendingCount = members.filter((m: any) => m.attending === true).length;
      const rejectedCount = members.filter((m: any) => m.attending === false).length;
      
      metrics.totalCupos += g.max_guests || 0;
      metrics.totalConfirmados += attendingCount;
      metrics.totalRechazados += rejectedCount;
      
      if (g.rsvp_closed) metrics.gruposCerrados++;
      
      if (g.rsvp_status === 'confirmado') metrics.gruposConfirmados++;
      else if (g.rsvp_status === 'parcial') metrics.gruposParciales++;

      return {
        ...mapGuestRowToUI(g),
        attendingCount,
        rejectedCount
      };
    });

    metrics.pendientes = Math.max(0, metrics.totalCupos - metrics.totalConfirmados - metrics.totalRechazados);

    console.log("GET_RSVP_DASHBOARD_OK", metrics);
    return { data: { guests: mappedGuests, metrics }, error: null };
  } catch (error: any) {
    console.error("GET_RSVP_DASHBOARD_ERROR", error);
    return { data: null, error };
  }
};

export const getGuestByRsvpCode = async (code: string) => {
  checkSupabase();
  console.log("GET_GUEST_BY_RSVP_CODE_START", { code });
  try {
    const { data, error } = await supabase!
      .from('guests')
      .select('*, guest_members(*)')
      .eq('rsvp_code', code.toUpperCase())
      .single();
    
    if (error) throw error;
    
    const mapped = mapGuestRowToUI(data);
    console.log("GET_GUEST_BY_RSVP_CODE_OK", { id: mapped.id });
    return { data: mapped, error: null };
  } catch (error: any) {
    console.error("GET_GUEST_BY_RSVP_CODE_ERROR", error);
    return { data: null, error };
  }
};

export const submitRsvpResponse = async (guestId: string, members: any[], rsvpStatus: string) => {
  checkSupabase();
  console.log("SUBMIT_RSVP_START", { guestId, rsvpStatus });
  try {
    // 1. Update guest status and timestamp
    const { error: guestError } = await supabase!
      .from('guests')
      .update({
        rsvp_status: rsvpStatus,
        rsvp_submitted_at: new Date().toISOString()
      })
      .eq('id', guestId);
    
    if (guestError) throw guestError;

    // 2. Update members
    for (const m of members) {
      const { error: memberError } = await supabase!
        .from('guest_members')
        .update({
          attending: m.attending,
          dietary_restrictions: m.dietaryRestrictions,
          rsvp_notes: m.rsvpNotes
        })
        .eq('id', m.id)
        .eq('guest_id', guestId);
      
      if (memberError) throw memberError;
    }

    console.log("SUBMIT_RSVP_OK");
    return { error: null };
  } catch (error: any) {
    console.error("SUBMIT_RSVP_ERROR", error);
    return { error };
  }
};

// --- Notifications ---

export const mapNotificationRowToUI = (row: any): NotificationItem => ({
  id: row.id,
  weddingId: row.wedding_id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  severity: row.severity,
  link: row.link,
  isRead: row.is_read,
  createdAt: row.created_at,
});

export const getNotificationsByWedding = async (weddingId: string, userId?: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_NOTIFS_START", { weddingId, userId });
  
  try {
    let query = supabase!
      .from('notifications')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data || []).map(mapNotificationRowToUI);
    console.log("GET_NOTIFS_OK", { count: mapped.length });
    return { data: mapped, error: null };
  } catch (error: any) {
    console.error("GET_NOTIFS_ERROR", error);
    return { data: null, error };
  }
};

export const markNotificationRead = async (id: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("READ_NOTIF_START", { id, weddingId });
  
  try {
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('wedding_id', weddingId);
    
    if (error) throw error;
    console.log("READ_NOTIF_OK");
    return { error: null };
  } catch (error: any) {
    console.error("READ_NOTIF_ERROR", error);
    return { error };
  }
};

export const markAllNotificationsRead = async (weddingId: string, userId?: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("READ_ALL_NOTIFS_START", { weddingId, userId });
  
  try {
    let query = supabase!
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('wedding_id', weddingId)
      .eq('is_read', false);
    
    if (userId) {
      query = query.or(`user_id.is.null,user_id.eq.${userId}`);
    } else {
      query = query.is('user_id', null);
    }

    const { error } = await query;
    if (error) throw error;
    console.log("READ_ALL_NOTIFS_OK");
    return { error: null };
  } catch (error: any) {
    console.error("READ_ALL_NOTIFS_ERROR", error);
    return { error };
  }
};

export const createNotification = async (payload: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead'>, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("CREATE_NOTIF_START", { payload, weddingId });
  
  try {
    const { data, error } = await supabase!
      .from('notifications')
      .insert({
        wedding_id: weddingId,
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        severity: payload.severity,
        link: payload.link,
        is_read: false
      })
      .select()
      .single();
    
    if (error) throw error;
    console.log("CREATE_NOTIF_OK");
    return { data: mapNotificationRowToUI(data), error: null };
  } catch (error: any) {
    console.error("CREATE_NOTIF_ERROR", error);
    return { data: null, error };
  }
};

export const upsertNotificationToken = async (token: string, weddingId: string, userId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPSERT_TOKEN_START", { token, weddingId, userId });
  
  try {
    const { error } = await supabase!
      .from('notification_tokens')
      .upsert({
        token,
        wedding_id: weddingId,
        user_id: userId,
        platform: 'web',
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });
    
    if (error) throw error;
    console.log("UPSERT_TOKEN_OK");
    return { error: null };
  } catch (error: any) {
    console.error("UPSERT_TOKEN_ERROR", error);
    return { error };
  }
};

export const disableNotificationTokens = async (weddingId: string, userId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DISABLE_TOKENS_START", { weddingId, userId });
  
  try {
    const { error } = await supabase!
      .from('notification_tokens')
      .delete()
      .eq('wedding_id', weddingId)
      .eq('user_id', userId);
    
    if (error) throw error;
    console.log("DISABLE_TOKENS_OK");
    return { error: null };
  } catch (error: any) {
    console.error("DISABLE_TOKENS_ERROR", error);
    return { error };
  }
};

// WEDDINGS
export const getWeddingById = async (weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("GET_WEDDING_START", { weddingId });
  try {
    const { data, error } = await supabase!
      .from('weddings')
      .select('id, partner1_name, partner2_name, wedding_date, total_budget, cover_image_url')
      .eq('id', weddingId)
      .maybeSingle();
    
    if (error) throw error;
    
    if (!data) {
      console.warn("GET_WEDDING_NOT_FOUND", { weddingId });
      return { data: null, error: null };
    }
    
    console.log("GET_WEDDING_OK", { 
      id: data.id, 
      hasCover: !!data.cover_image_url 
    });
    return { data, error: null };
  } catch (error: any) {
    console.error("GET_WEDDING_ERROR", error);
    return { data: null, error };
  }
};

export const updateWedding = async (weddingId: string, updates: any) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("UPDATE_WEDDING_START", { weddingId, updates });
  const { error } = await supabase!.from('weddings').update(updates).eq('id', weddingId);
  if (error) console.error("UPDATE_WEDDING_ERROR", error);
  else console.log("UPDATE_WEDDING_OK");
  return { error };
};

export const deleteTask = async (taskId: string, weddingId: string) => {
  checkSupabase();
  checkWeddingId(weddingId);
  console.log("DELETE_TASK_START", { taskId, weddingId });
  const { error } = await supabase!.from('tasks').delete().eq('id', taskId).eq('wedding_id', weddingId);
  if (error) console.error("DELETE_TASK_ERROR", error);
  else console.log("DELETE_TASK_OK");
  return { error };
};
