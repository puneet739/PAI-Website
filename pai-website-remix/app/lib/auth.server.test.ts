import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock the db.server module
vi.mock('./db.server', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

describe('Auth Server', () => {
  let verifyLogin: any;
  let getMemberById: any;
  let getMemberByEmail: any;
  let createMember: any;
  let query: any;
  let queryOne: any;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Import fresh instances
    const dbModule = await import('./db.server');
    query = dbModule.query;
    queryOne = dbModule.queryOne;
    
    const authModule = await import('./auth.server');
    verifyLogin = authModule.verifyLogin;
    getMemberById = authModule.getMemberById;
    getMemberByEmail = authModule.getMemberByEmail;
    createMember = authModule.createMember;
  });

  describe('verifyLogin', () => {
    it('should return member when credentials are valid', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        phone: null,
        profile_image: null,
        membership_type: 'basic',
        membership_status: 'active',
        active_until: null,
        pilot_rating: 'P1',
        total_flights: 0,
        total_flight_hours: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await verifyLogin('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.password_hash).toBeUndefined();
    });

    it('should return null when member not found', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);

      const result = await verifyLogin('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        password_hash: await bcrypt.hash('correctpassword', 10),
        name: 'Test User',
      };

      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await verifyLogin('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('getMemberById', () => {
    it('should return member when found', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        membership_type: 'basic',
      };

      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await getMemberById(1);

      expect(result).toEqual(mockMember);
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
    });

    it('should return null when member not found', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);

      const result = await getMemberById(999);

      expect(result).toBeNull();
    });
  });

  describe('getMemberByEmail', () => {
    it('should return member when found', async () => {
      const mockMember = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await getMemberByEmail('test@example.com');

      expect(result).toEqual(mockMember);
    });

    it('should return null when member not found', async () => {
      vi.mocked(queryOne).mockResolvedValue(null);

      const result = await getMemberByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createMember', () => {
    it('should create a new member successfully', async () => {
      const mockMember = {
        id: 1,
        email: 'newuser@example.com',
        name: 'New User',
        phone: '+919876543210',
        membership_status: 'inactive',
      };

      vi.mocked(query).mockResolvedValue({ insertId: 1 });
      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await createMember(
        'newuser@example.com',
        'password123',
        'New User',
        '+919876543210'
      );

      expect(result).toEqual(mockMember);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO members'),
        expect.arrayContaining(['newuser@example.com', expect.any(String), 'New User', '+919876543210'])
      );
    });

    it('should create member without phone number', async () => {
      const mockMember = {
        id: 1,
        email: 'newuser@example.com',
        name: 'New User',
        phone: null,
      };

      vi.mocked(query).mockResolvedValue({ insertId: 1 });
      vi.mocked(queryOne).mockResolvedValue(mockMember);

      const result = await createMember(
        'newuser@example.com',
        'password123',
        'New User'
      );

      expect(result).toEqual(mockMember);
    });

    it('should throw error when member creation fails', async () => {
      vi.mocked(query).mockResolvedValue({ insertId: 1 });
      vi.mocked(queryOne).mockResolvedValue(null);

      await expect(
        createMember('newuser@example.com', 'password123', 'New User')
      ).rejects.toThrow('Failed to create member');
    });
  });
});
