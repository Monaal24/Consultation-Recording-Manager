import { readDB, writeDB, generateId, IUser } from '../config/db';

export const UserModel = {
  async findById(id: string): Promise<IUser | null> {
    const db = readDB();
    return db.users.find(u => u.id === id) || null;
  },

  async findByEmail(email: string): Promise<IUser | null> {
    const db = readDB();
    const cleanEmail = email.toLowerCase().trim();
    return db.users.find(u => u.email.toLowerCase().trim() === cleanEmail) || null;
  },

  async create(user: Omit<IUser, 'id'>): Promise<IUser> {
    const db = readDB();
    const newUser: IUser = {
      id: generateId('u'),
      ...user,
      email: user.email.toLowerCase().trim()
    };
    db.users.push(newUser);
    writeDB(db);
    return newUser;
  }
};
