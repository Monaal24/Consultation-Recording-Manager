import { readDB, writeDB, generateId, IRecording } from '../config/db';

export const RecordingModel = {
  async findMany(userId: string): Promise<IRecording[]> {
    const db = readDB();
    // Get consultations owned by user
    const conIds = db.consultations
      .filter(c => c.createdBy === userId)
      .map(c => c.id);
    
    return db.recordings.filter(r => conIds.includes(r.consultationId));
  },

  async findById(id: string, userId: string): Promise<IRecording | null> {
    const db = readDB();
    const recording = db.recordings.find(r => r.id === id);
    if (!recording) return null;

    // Verify consultation ownership
    const consultation = db.consultations.find(c => c.id === recording.consultationId && c.createdBy === userId);
    if (!consultation) return null;

    return recording;
  },

  async create(userId: string, data: Omit<IRecording, 'id' | 'uploadDate'>): Promise<IRecording | null> {
    const db = readDB();
    
    // Validate consultation ownership
    const consultation = db.consultations.find(c => c.id === data.consultationId && c.createdBy === userId);
    if (!consultation) return null;

    const newRecording: IRecording = {
      id: generateId('rec'),
      ...data,
      uploadDate: new Date().toISOString()
    };
    db.recordings.push(newRecording);
    writeDB(db);
    return newRecording;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = readDB();
    const recordingIndex = db.recordings.findIndex(r => r.id === id);
    if (recordingIndex === -1) return false;

    const recording = db.recordings[recordingIndex];

    // Validate consultation ownership
    const consultation = db.consultations.find(c => c.id === recording.consultationId && c.createdBy === userId);
    if (!consultation) return false;

    // Remove recording
    db.recordings.splice(recordingIndex, 1);
    writeDB(db);
    return true;
  }
};
