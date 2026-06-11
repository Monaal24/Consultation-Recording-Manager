import { readDB, writeDB, generateId, INote } from '../config/db';

export const NoteModel = {
  async findMany(userId: string): Promise<INote[]> {
    const db = readDB();
    // Find consultations owned by user
    const conIds = db.consultations
      .filter(c => c.createdBy === userId)
      .map(c => c.id);
    
    return db.notes.filter(n => conIds.includes(n.consultationId));
  },

  async findById(id: string, userId: string): Promise<INote | null> {
    const db = readDB();
    const note = db.notes.find(n => n.id === id);
    if (!note) return null;

    // Check ownership of the consultation
    const consultation = db.consultations.find(c => c.id === note.consultationId && c.createdBy === userId);
    if (!consultation) return null;

    return note;
  },

  async create(userId: string, data: Omit<INote, 'id' | 'createdAt'>): Promise<INote | null> {
    const db = readDB();
    
    // Validate consultation ownership
    const consultation = db.consultations.find(c => c.id === data.consultationId && c.createdBy === userId);
    if (!consultation) return null;

    const newNote: INote = {
      id: generateId('n'),
      ...data,
      createdAt: new Date().toISOString()
    };
    db.notes.push(newNote);
    writeDB(db);
    return newNote;
  },

  async update(id: string, userId: string, updateData: Partial<Omit<INote, 'id' | 'createdAt'>>): Promise<INote | null> {
    const db = readDB();
    const index = db.notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    const note = db.notes[index];
    
    // Check consultation ownership
    const consultation = db.consultations.find(c => c.id === note.consultationId && c.createdBy === userId);
    if (!consultation) return null;

    db.notes[index] = {
      ...db.notes[index],
      ...updateData
    };
    writeDB(db);
    return db.notes[index];
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = readDB();
    const index = db.notes.findIndex(n => n.id === id);
    if (index === -1) return false;

    const note = db.notes[index];

    // Check consultation ownership
    const consultation = db.consultations.find(c => c.id === note.consultationId && c.createdBy === userId);
    if (!consultation) return false;

    db.notes.splice(index, 1);
    writeDB(db);
    return true;
  }
};
