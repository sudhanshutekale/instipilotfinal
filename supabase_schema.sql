-- ==============================================================================
-- InstiPilot Supabase PostgreSQL Schema & Seed Script
-- Run this in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Users (Staff, Admin, Students)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'counselor', 'trainer', 'accounts', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    type TEXT NOT NULL,
    equipment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trainers
CREATE TABLE IF NOT EXISTS trainers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    specializations TEXT NOT NULL,
    availability TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    total_fee NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Batches
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    trainer_id TEXT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    days TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('classroom', 'online', 'hybrid')),
    online_seat_limit INTEGER DEFAULT 50,
    max_seats INTEGER NOT NULL DEFAULT 35,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK(status IN ('upcoming', 'ongoing', 'completed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Students
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    guardian_name TEXT,
    guardian_phone TEXT,
    city TEXT,
    college TEXT,
    join_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'dropped', 'on_leave')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    preferred_mode TEXT NOT NULL DEFAULT 'hybrid' CHECK(preferred_mode IN ('classroom', 'online', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    UNIQUE(student_id, batch_id)
);

-- 8. Fee Plans
CREATE TABLE IF NOT EXISTS fee_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL,
    down_payment NUMERIC NOT NULL DEFAULT 0,
    num_installments INTEGER NOT NULL DEFAULT 1,
    discount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EMI Installments
CREATE TABLE IF NOT EXISTS emi_installments (
    id TEXT PRIMARY KEY,
    fee_plan_id TEXT NOT NULL REFERENCES fee_plans(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    installment_no INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('paid', 'pending', 'overdue')),
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    emi_id TEXT REFERENCES emi_installments(id) ON DELETE SET NULL,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK(source IN ('upi', 'bank', 'cash', 'card')),
    reference TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'verified' CHECK(status IN ('verified', 'pending', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Student Payment Proofs
CREATE TABLE IF NOT EXISTS payment_proofs (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    emi_id TEXT NOT NULL REFERENCES emi_installments(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reference TEXT NOT NULL,
    proof_image_url TEXT NOT NULL,
    payment_mode TEXT DEFAULT 'upi',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('classroom', 'online')),
    check_in_time TEXT,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
    ip_or_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, batch_id, date)
);

-- 12. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'pending', 'late')),
    marks INTEGER,
    feedback TEXT,
    submission_url TEXT,
    UNIQUE(assignment_id, student_id)
);

-- 14. Recordings
CREATE TABLE IF NOT EXISTS recordings (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    topic_tags TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Timetable Slots
CREATE TABLE IF NOT EXISTS timetable_slots (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id TEXT NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Messages Outbox
CREATE TABLE IF NOT EXISTS messages_outbox (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK(channel IN ('whatsapp', 'sms', 'email')),
    template_name TEXT,
    message_text TEXT NOT NULL,
    draft_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'rejected', 'sent')),
    created_by_role TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    query TEXT,
    result_summary TEXT,
    status TEXT NOT NULL CHECK(status IN ('success', 'blocked', 'warning', 'error')),
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Demo Seed Data (Safe Upserts)
-- ==============================================================================

-- 1. Demo Users
INSERT INTO users (id, name, email, password_hash, role, avatar_url) VALUES
('u_owner', 'Priya Sharma', 'priya.sharma@instipilot.com', 'hash_demo_owner', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'),
('u_trainer_vikram', 'Vikram Malhotra', 'vikram.m@instipilot.com', 'hash_demo_trainer', 'trainer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('u_counselor_rajesh', 'Rajesh Rao', 'rajesh.rao@instipilot.com', 'hash_demo_counselor', 'counselor', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'),
('u_accounts_neha', 'Neha Joshi', 'neha.joshi@instipilot.com', 'hash_demo_accounts', 'accounts', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'),
('u_student_aarav', 'Aarav Sharma', 'aarav.sharma@gmail.com', 'hash_demo_student', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150')
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Rooms
INSERT INTO rooms (id, name, capacity, type, equipment) VALUES
('rm_101', 'Newton Lab (Room 101)', 35, 'Lab', '35 High-End PCs, 4K Projector, AC'),
('rm_102', 'Turing Hall (Room 102)', 40, 'Classroom', 'Smart Board, PA System, Dual Mics'),
('rm_103', 'Ramanujan Hall (Room 103)', 30, 'Classroom', 'Projector, Whiteboard, High-Speed WiFi'),
('rm_online', 'Virtual Studio Zoom-1', 100, 'Seminar Hall', 'Dedicated Zoom License, Green Screen, Shure Mic')
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Trainers
INSERT INTO trainers (id, user_id, name, email, phone, specializations, availability) VALUES
('tr_vikram', 'u_trainer_vikram', 'Vikram Malhotra', 'vikram.m@instipilot.com', '+91 98201 12345', 'Full-Stack Java, Spring Boot, Microservices', '{"Mon":["08:00-14:00"],"Wed":["08:00-14:00"],"Fri":["08:00-14:00"]}'),
('tr_ananya', NULL, 'Ananya Desai', 'ananya.d@instipilot.com', '+91 98202 23456', 'Python Data Science, Machine Learning, SQL', '{"Tue":["09:00-15:00"],"Thu":["09:00-15:00"],"Sat":["10:00-16:00"]}'),
('tr_rohit', NULL, 'Rohit Verma', 'rohit.v@instipilot.com', '+91 98203 34567', 'MERN Stack, Next.js, TypeScript, Tailwind', '{"Mon":["10:00-16:00"],"Tue":["10:00-16:00"],"Thu":["10:00-16:00"]}')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Courses
INSERT INTO courses (id, code, name, description, duration_weeks, total_fee) VALUES
('crs_fs_java', 'FS-JAVA-01', 'Full-Stack Java Enterprise Development', 'End-to-end Java with Spring Boot, Microservices, Angular, and AWS cloud deployment.', 16, 45000),
('crs_ds_python', 'DS-PY-02', 'Data Science & Applied Machine Learning', 'Comprehensive Python, Pandas, Scikit-Learn, Deep Learning, and Real-World Capstones.', 14, 48000),
('crs_mern', 'MERN-03', 'Modern Web Engineering with MERN & Next.js', 'React 18, Next.js 14, Node, Express, MongoDB, and Production DevOps.', 12, 38000)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Batches
INSERT INTO batches (id, course_id, trainer_id, room_id, name, days, start_time, end_time, mode, online_seat_limit, max_seats, status, start_date, end_date) VALUES
('batch_java_morn', 'crs_fs_java', 'tr_vikram', 'rm_101', 'Java Enterprise - Morning Alpha', 'Mon,Wed,Fri', '08:30', '10:30', 'hybrid', 40, 35, 'ongoing', '2026-09-01', '2026-12-30'),
('batch_ds_eve', 'crs_ds_python', 'tr_ananya', 'rm_102', 'Data Science & AI - Evening Beta', 'Tue,Thu,Sat', '17:00', '19:00', 'classroom', 0, 30, 'ongoing', '2026-09-15', '2027-01-15'),
('batch_mern_wknd', 'crs_mern', 'tr_rohit', 'rm_online', 'MERN Masterclass - Weekend FastTrack', 'Sat,Sun', '10:00', '13:00', 'online', 60, 50, 'ongoing', '2026-10-01', '2027-01-20')
ON CONFLICT (id) DO NOTHING;

-- 6. Demo Student (Matches demo portal)
INSERT INTO students (id, name, email, phone, guardian_name, guardian_phone, city, college, join_date, status, notes) VALUES
('std_aarav', 'Aarav Sharma', 'aarav.sharma@gmail.com', '+91 98111 22334', 'Ramesh Sharma', '+91 98111 22335', 'Pune', 'COEP Technological University', '2026-09-01', 'active', 'High potential candidate, preparing for campus recruitment.')
ON CONFLICT (id) DO NOTHING;

-- 7. Demo Enrollment
INSERT INTO enrollments (id, student_id, batch_id, preferred_mode, status) VALUES
('enr_aarav_java', 'std_aarav', 'batch_java_morn', 'hybrid', 'active')
ON CONFLICT (id) DO NOTHING;

-- 8. Demo Fee Plan & EMIs
INSERT INTO fee_plans (id, student_id, course_id, total_amount, down_payment, num_installments, discount, notes) VALUES
('fp_aarav', 'std_aarav', 'crs_fs_java', 45000, 15000, 3, 0, 'Standard 3-EMI plan')
ON CONFLICT (id) DO NOTHING;

INSERT INTO emi_installments (id, fee_plan_id, student_id, installment_no, due_date, amount, status, paid_date) VALUES
('emi_aarav_1', 'fp_aarav', 'std_aarav', 1, '2026-09-01', 15000, 'paid', '2026-09-01'),
('emi_aarav_2', 'fp_aarav', 'std_aarav', 2, '2026-10-01', 15000, 'pending', NULL),
('emi_aarav_3', 'fp_aarav', 'std_aarav', 3, '2026-11-01', 15000, 'pending', NULL)
ON CONFLICT (id) DO NOTHING;

-- 9. Demo Down Payment
INSERT INTO payments (id, emi_id, student_id, source, reference, amount, date, notes, status) VALUES
('pay_aarav_down', 'emi_aarav_1', 'std_aarav', 'upi', 'UPI-983210492810', 15000, '2026-09-01', 'Admission down payment', 'verified')
ON CONFLICT (id) DO NOTHING;

-- 10. Enable Row Level Security (RLS) & Allow Read/Write for Authenticated / Service Role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE emi_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon & authenticated roles (instipilot handles application-level RBAC)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public full access" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Public full access" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;
