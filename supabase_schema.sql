-- ==============================================================================
-- InstiPilot Supabase PostgreSQL Schema & Complete Seed Script
-- All 17 Tables + Full Production Seed Data (66 Students, 15 Batches, Timetable, Fees)
-- Paste into Supabase SQL Editor and click RUN
-- ==============================================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'counselor', 'trainer', 'accounts', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    type TEXT NOT NULL,
    equipment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trainers
CREATE TABLE IF NOT EXISTS public.trainers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    specializations TEXT NOT NULL,
    availability TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    total_fee NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Batches
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    trainer_id TEXT NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.students (
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
CREATE TABLE IF NOT EXISTS public.enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    preferred_mode TEXT NOT NULL DEFAULT 'hybrid' CHECK(preferred_mode IN ('classroom', 'online', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
    UNIQUE(student_id, batch_id)
);

-- 8. Fee Plans
CREATE TABLE IF NOT EXISTS public.fee_plans (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL,
    down_payment NUMERIC NOT NULL DEFAULT 0,
    num_installments INTEGER NOT NULL DEFAULT 1,
    discount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EMI Installments
CREATE TABLE IF NOT EXISTS public.emi_installments (
    id TEXT PRIMARY KEY,
    fee_plan_id TEXT NOT NULL REFERENCES public.fee_plans(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    installment_no INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('paid', 'pending', 'overdue')),
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    emi_id TEXT REFERENCES public.emi_installments(id) ON DELETE SET NULL,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK(source IN ('upi', 'bank', 'cash', 'card')),
    reference TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'verified' CHECK(status IN ('verified', 'pending', 'flagged')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10b. Student Payment Proofs
CREATE TABLE IF NOT EXISTS public.payment_proofs (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    emi_id TEXT NOT NULL REFERENCES public.emi_installments(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reference TEXT NOT NULL,
    proof_image_url TEXT NOT NULL,
    payment_mode TEXT DEFAULT 'upi',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    verified_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('classroom', 'online')),
    check_in_time TEXT,
    status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late')),
    ip_or_location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, batch_id, date)
);

-- 12. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'pending', 'late')),
    marks INTEGER,
    feedback TEXT,
    submission_url TEXT,
    UNIQUE(assignment_id, student_id)
);

-- 14. Recordings
CREATE TABLE IF NOT EXISTS public.recordings (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    topic_tags TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Timetable Slots
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    trainer_id TEXT NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
    room_id TEXT REFERENCES public.rooms(id) ON DELETE SET NULL,
    day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Messages Outbox
CREATE TABLE IF NOT EXISTS public.messages_outbox (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS public.audit_log (
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

-- Enable RLS and create open policy for public role
DO 995
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Public full access" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END 995;

-- ==============================================================================
-- COMPLETE PRODUCTION SEED DATA (FROM LOCAL INSTIPILOT DB)
-- ==============================================================================

-- Table: users (9 rows)
INSERT INTO public."users" ("id", "name", "email", "password_hash", "role", "avatar_url", "created_at")
VALUES
  ('u_owner', 'Priya Sharma (Director)', 'owner@instipilot.com', 'demo_hash_owner', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '2026-10-16 12:11:02'),
  ('u_counselor', 'Rajesh Rao (Counselor)', 'counselor@instipilot.com', 'demo_hash_counselor', 'counselor', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '2026-10-16 12:11:02'),
  ('u_trainer', 'Vikram Malhotra (Lead Trainer)', 'trainer@instipilot.com', 'demo_hash_trainer', 'trainer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '2026-10-16 12:11:02'),
  ('u_accounts', 'Neha Joshi (Accounts Manager)', 'accounts@instipilot.com', 'demo_hash_accounts', 'accounts', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '2026-10-16 12:11:02'),
  ('u_owner_1792158298500', 'Dr. Sameer Joshi', 'sameer.owner@instipilot.com', 'demo_hashed_pass_123', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '2026-10-16 13:44:58'),
  ('u_trainer_1792158552283', 'Prof. Ritu Verma', 'ritu.trainer@instipilot.com', 'demo_hashed_pass_123', 'trainer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '2026-10-16 13:49:12'),
  ('u_owner_1792161044611', 'Dr. Rajesh Sharma', 'rajesh.sharma@instipilot.com', 'demo_hashed_pass_123', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '2026-10-16 14:30:44'),
  ('u_owner_1792162015276', 'Prof. Meenakshi Sundaram', 'meenakshi@instipilot.com', 'demo_hashed_pass_123', 'owner', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '2026-10-16 14:46:55'),
  ('u_student', 'Aarav Gupta', 'student@instipilot.com', 'demo_hash_student', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', '2026-10-17 02:40:52')
ON CONFLICT (id) DO NOTHING;

-- Table: rooms (5 rows)
INSERT INTO public."rooms" ("id", "name", "capacity", "type", "equipment", "created_at")
VALUES
  ('room_1', 'Lab Alpha (PC-35)', 35, 'Computer Lab', '35 Dell OptiPlex i7, Dual Projectors, Gigabit LAN, AC', '2026-10-16 12:11:02'),
  ('room_2', 'Lab Beta (GPU-30)', 30, 'AI/ML Lab', '30 RTX-4070 Workstations, 4K Display, Fiber LAN, AC', '2026-10-16 12:11:02'),
  ('room_3', 'Seminar Hall 1', 60, 'Hybrid Auditorium', 'PTZ Tracking Cameras, Yamaha Audio Rig, 65" Confidence Monitor', '2026-10-16 12:11:02'),
  ('room_4', 'Classroom 201', 25, 'Lecture Hall', 'Interactive Touch Whiteboard, Soundbar, AC', '2026-10-16 12:11:02'),
  ('room_5', 'Classroom 202', 20, 'Discussion Studio', 'Motorized Screen, Epson Laser Projector, Mic System', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

-- Table: trainers (7 rows)
INSERT INTO public."trainers" ("id", "user_id", "name", "email", "phone", "specializations", "availability", "created_at")
VALUES
  ('t_vikram', 'u_trainer', 'Vikram Malhotra', 'vikram.malhotra@instipilot.com', '+91 98201 11223', 'Java Fullstack, Spring Boot, Microservices, Enterprise Architecture', '{"Mon":["08:00-14:00","18:00-20:30"],"Tue":["10:00-16:00"],"Wed":["08:00-14:00","18:00-20:30"],"Thu":["10:00-16:00"],"Fri":["08:00-14:00","18:00-20:30"],"Sat":["09:00-14:00"],"Sun":["09:00-14:00"]}', '2026-10-16 12:11:02'),
  ('t_sunita', NULL, 'Sunita Deshmukh', 'sunita.deshmukh@instipilot.com', '+91 98202 22334', 'Python, Data Engineering, Pandas, PySpark, Airflow', '{"Mon":["09:00-17:00"],"Tue":["09:00-17:00"],"Wed":["09:00-17:00"],"Thu":["09:00-17:00"],"Fri":["09:00-17:00"],"Sat":["10:00-15:00"],"Sun":[]}', '2026-10-16 12:11:02'),
  ('t_arjun', NULL, 'Arjun Mehta', 'arjun.mehta@instipilot.com', '+91 98203 33445', 'MERN Stack, Next.js, TypeScript, Tailwind, System Design', '{"Mon":["14:00-21:00"],"Tue":["14:00-21:00"],"Wed":["14:00-21:00"],"Thu":["14:00-21:00"],"Fri":["14:00-21:00"],"Sat":["10:00-18:00"],"Sun":[]}', '2026-10-16 12:11:02'),
  ('t_pooja', NULL, 'Pooja Sundaram', 'pooja.sundaram@instipilot.com', '+91 98204 44556', 'Applied Data Science, Machine Learning, TensorFlow, SQL', '{"Mon":["09:00-13:00"],"Tue":["09:00-13:00"],"Wed":["09:00-13:00"],"Thu":["09:00-13:00"],"Fri":["09:00-13:00"],"Sat":["10:00-19:00"],"Sun":["10:00-19:00"]}', '2026-10-16 12:11:02'),
  ('t_rahul', NULL, 'Rahul Kulkarni', 'rahul.kulkarni@instipilot.com', '+91 98205 55667', 'Embedded Systems, IoT, C/C++, ARM Cortex, Firmware Architecture', '{"Mon":["08:00-15:00"],"Tue":["08:00-15:00"],"Wed":["08:00-15:00"],"Thu":["08:00-15:00"],"Fri":["08:00-15:00"],"Sat":[],"Sun":[]}', '2026-10-16 12:11:02'),
  ('t_aniket', NULL, 'Aniket Patil', 'aniket.patil@instipilot.com', '+91 98206 66778', 'Advanced DBMS, PostgreSQL, MySQL Internals, Query Optimization', '{"Mon":["10:00-18:00"],"Tue":["10:00-18:00"],"Wed":["10:00-18:00"],"Thu":["10:00-18:00"],"Fri":["10:00-18:00"],"Sat":["09:00-16:00"],"Sun":["09:00-16:00"]}', '2026-10-16 12:11:02'),
  ('t_1792158552283', 'u_trainer_1792158552283', 'Prof. Ritu Verma', 'ritu.trainer@instipilot.com', '+91 98765 43210', 'Cloud DevOps, Kubernetes & AWS Architecture', '{"mon":["09:00-17:00"],"tue":["09:00-17:00"],"wed":["09:00-17:00"],"thu":["09:00-17:00"],"fri":["09:00-17:00"]}', '2026-10-16 13:49:12')
ON CONFLICT (id) DO NOTHING;

-- Table: courses (6 rows)
INSERT INTO public."courses" ("id", "code", "name", "description", "duration_weeks", "total_fee", "created_at")
VALUES
  ('c_java', 'FS-JAVA', 'Java Fullstack & Cloud Microservices', 'Comprehensive Java, Spring Boot, Hibernate, AWS & Docker for enterprise scale.', 16, 45000.0, '2026-10-16 12:11:02'),
  ('c_dbms', 'DB-SQL', 'Advanced DBMS & Database Engineering', 'Index architecture, query tuning, transaction isolation, PostgreSQL and MySQL.', 8, 25000.0, '2026-10-16 12:11:02'),
  ('c_pydata', 'PY-DATA', 'Python for Data Engineering & Cloud', 'Python OOP, Pandas, Apache Airflow, ETL pipelines and Big Data streaming.', 12, 38000.0, '2026-10-16 12:11:02'),
  ('c_mern', 'WEB-MERN', 'Modern Fullstack Web Dev (MERN + Next.js)', 'React 18, Next.js 14, Node.js, Express, MongoDB, Tailwind and Realtime WebSockets.', 14, 42000.0, '2026-10-16 12:11:02'),
  ('c_aiml', 'AI-ML', 'Applied Data Science & Generative AI Systems', 'Statistical foundations, Scikit-learn, PyTorch, LLM agents and Vector Databases.', 16, 52000.0, '2026-10-16 12:11:02'),
  ('c_iot', 'EMB-IOT', 'Embedded Systems & IoT Engineering', 'Bare-metal C, RTOS, ESP32, MQTT protocols, PCB design and Sensor Interfacing.', 12, 36000.0, '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

-- Table: batches (15 rows)
INSERT INTO public."batches" ("id", "course_id", "trainer_id", "room_id", "name", "days", "start_time", "end_time", "mode", "online_seat_limit", "max_seats", "status", "start_date", "end_date", "created_at")
VALUES
  ('b_java_m1', 'c_java', 't_vikram', 'room_1', 'Java Fullstack Morning (Alpha)', 'Mon,Wed,Fri', '08:00', '10:00', 'hybrid', 30, 32, 'ongoing', '2026-09-01', '2026-12-24', '2026-10-16 12:11:02'),
  ('b_java_fast', 'c_java', 't_vikram', 'room_4', 'Java Sprint Fast-Track', 'Mon,Wed,Fri', '10:15', '12:15', 'classroom', 0, 24, 'ongoing', '2026-09-15', '2026-12-15', '2026-10-16 12:11:02'),
  ('b_java_e1', 'c_java', 't_vikram', 'room_4', 'Java Fullstack Evening Pro', 'Mon,Wed,Fri', '18:00', '20:00', 'classroom', 0, 25, 'ongoing', '2026-08-15', '2026-12-05', '2026-10-16 12:11:02'),
  ('b_py_m2', 'c_pydata', 't_sunita', 'room_2', 'Python Data Engineering Cohort 4', 'Tue,Thu,Sat', '09:00', '11:00', 'hybrid', 30, 30, 'ongoing', '2026-09-05', '2026-11-28', '2026-10-16 12:11:02'),
  ('b_mern_e2', 'c_mern', 't_arjun', 'room_1', 'Modern MERN & Cloud Cohort 7', 'Mon,Tue,Thu', '16:30', '18:30', 'hybrid', 35, 35, 'ongoing', '2026-09-10', '2026-12-20', '2026-10-16 12:11:02'),
  ('b_ai_w2', 'c_aiml', 't_pooja', 'room_3', 'Weekend AI & GenAI Masterclass', 'Sat,Sun', '14:00', '18:00', 'hybrid', 50, 55, 'ongoing', '2026-08-20', '2026-12-15', '2026-10-16 12:11:02'),
  ('b_iot_m3', 'c_iot', 't_rahul', 'room_5', 'Embedded Systems & IoT Hardware Lab', 'Tue,Thu', '08:00', '11:00', 'classroom', 0, 20, 'ongoing', '2026-09-02', '2026-11-25', '2026-10-16 12:11:02'),
  ('b_dbms_w1', 'c_dbms', 't_aniket', NULL, 'Database Engineering Online Global', 'Sat,Sun', '10:00', '13:00', 'online', 60, 60, 'ongoing', '2026-09-12', '2026-11-08', '2026-10-16 12:11:02'),
  ('b_1792157733120', 'c_java', 't_vikram', 'room_1', 'Java Evening Cohort Pro 2', 'Mon,Wed,Fri', '16:00', '19:00', 'hybrid', 25, 30, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 13:35:33'),
  ('b_1792157749454', 'c_java', 't_vikram', 'room_1', 'Java Evening Cohort Pro 2', 'Mon,Wed,Fri', '16:00', '19:00', 'hybrid', 25, 30, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 13:35:49'),
  ('b_1792158144402', 'c_java', 't_vikram', 'room_1', 'Java Weekend Express Test', 'Sat,Sun', '09:00', '12:00', 'hybrid', 25, 30, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 13:42:24'),
  ('b_1792158200748', 'c_java', 't_vikram', 'room_1', 'Java Weekend Express Test', 'Sat,Sun', '09:00', '12:00', 'hybrid', 25, 30, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 13:43:20'),
  ('b_1792158734744', 'c_java', 't_vikram', 'room_1', 'Java Evening Cohort Pro 2', 'Mon,Wed,Fri', '14:00', '16:00', 'hybrid', 25, 30, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 13:52:14'),
  ('b_1792161038465', 'c_java', 't_vikram', 'room_1', 'Test Evening Batch', 'Tue,Thu', '18:00', '20:00', 'hybrid', 20, 25, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 14:30:38'),
  ('b_1792162002036', 'c_pydata', 't_sunita', 'room_2', 'Cloud Data Eng Weekend Cohort', 'Sat,Sun', '10:00', '13:00', 'hybrid', 30, 35, 'upcoming', '2026-10-16', '2027-01-14', '2026-10-16 14:46:42')
ON CONFLICT (id) DO NOTHING;

-- Table: students (66 rows)
INSERT INTO public."students" ("id", "name", "email", "phone", "guardian_name", "guardian_phone", "city", "college", "join_date", "status", "notes", "created_at")
VALUES
  ('s_001', 'Aarav Gupta', 'aarav.gupta1@example.com', '+91 9820011111', 'Dr. Rameshwar Gupta', '+91 9730011999', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_002', 'Ananya Deshmukh', 'ananya.deshmukh2@example.com', '+91 9820022222', 'Mr. Ramesh Deshmukh', '+91 9730022222', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_003', 'Rohan Gupta', 'rohan.gupta3@example.com', '+91 9820033333', 'Mr. Ramesh Gupta', '+91 9730033333', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_004', 'Sneha Nair', 'sneha.nair4@example.com', '+91 9820044444', 'Mr. Ramesh Nair', '+91 9730044444', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_005', 'Aditya Verma', 'aditya.verma5@example.com', '+91 9820055555', 'Mr. Ramesh Verma', '+91 9730055555', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_006', 'Pooja Kulkarni', 'pooja.kulkarni6@example.com', '+91 9820066666', 'Mr. Ramesh Kulkarni', '+91 9730066666', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_007', 'Ananya Deshmukh', 'ananya.deshmukh7@example.com', '+91 9820077777', 'Mr. Ramesh Deshmukh', '+91 9730077777', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_008', 'Divya Mehta', 'divya.mehta8@example.com', '+91 9820088888', 'Mr. Ramesh Mehta', '+91 9730088888', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_009', 'Vikram Rao', 'vikram.rao9@example.com', '+91 9820099999', 'Mr. Ramesh Rao', '+91 9730099999', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_010', 'Isha Joshi', 'isha.joshi10@example.com', '+91 9820111110', 'Mr. Ramesh Joshi', '+91 9730111110', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_011', 'Kunal Iyer', 'kunal.iyer11@example.com', '+91 9820122221', 'Mr. Ramesh Iyer', '+91 9730122221', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_012', 'Amit Patel', 'amit.patel12@example.com', '+91 9820133332', 'Mr. Ramesh Patel', '+91 9730133332', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_013', 'Rahul Reddy', 'rahul.reddy13@example.com', '+91 9820144443', 'Mr. Ramesh Reddy', '+91 9730144443', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_014', 'Tanvi Chauhan', 'tanvi.chauhan14@example.com', '+91 9820155554', 'Mr. Ramesh Chauhan', '+91 9730155554', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_015', 'Siddharth Bhatia', 'siddharth.bhatia15@example.com', '+91 9820166665', 'Mr. Ramesh Bhatia', '+91 9730166665', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_016', 'Meera Mishra', 'meera.mishra16@example.com', '+91 9820177776', 'Mr. Ramesh Mishra', '+91 9730177776', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_017', 'Gaurav Singh', 'gaurav.singh17@example.com', '+91 9820188887', 'Mr. Ramesh Singh', '+91 9730188887', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_018', 'Riya Agarwal', 'riya.agarwal18@example.com', '+91 9820199998', 'Mr. Ramesh Agarwal', '+91 9730199998', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_019', 'Akash Pillai', 'akash.pillai19@example.com', '+91 9820211109', 'Mr. Ramesh Pillai', '+91 9730211109', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_020', 'Shruti Pandey', 'shruti.pandey20@example.com', '+91 9820222220', 'Mr. Ramesh Pandey', '+91 9730222220', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_021', 'Varun Trivedi', 'varun.trivedi21@example.com', '+91 9820233331', 'Mr. Ramesh Trivedi', '+91 9730233331', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_022', 'Kavita Bose', 'kavita.bose22@example.com', '+91 9820244442', 'Mr. Ramesh Bose', '+91 9730244442', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_023', 'Manish Shah', 'manish.shah23@example.com', '+91 9820255553', 'Mr. Ramesh Shah', '+91 9730255553', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_024', 'Priyanka Nambiar', 'priyanka.nambiar24@example.com', '+91 9820266664', 'Mr. Ramesh Nambiar', '+91 9730266664', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_java', '2026-10-16 12:11:02'),
  ('s_025', 'Kavita Nair', 'kavita.nair25@example.com', '+91 9820277775', 'Mr. Ramesh Nair', '+91 9730277775', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_026', 'Simran Yadav', 'simran.yadav26@example.com', '+91 9820288886', 'Mr. Ramesh Yadav', '+91 9730288886', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_027', 'Harsh Saxena', 'harsh.saxena27@example.com', '+91 9820299997', 'Mr. Ramesh Saxena', '+91 9730299997', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_028', 'Swati Choudhury', 'swati.choudhury28@example.com', '+91 9820311108', 'Mr. Ramesh Choudhury', '+91 9730311108', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_029', 'Karan Ghosh', 'karan.ghosh29@example.com', '+91 9820322219', 'Mr. Ramesh Ghosh', '+91 9730322219', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_030', 'Deepika Malhotra', 'deepika.malhotra30@example.com', '+91 9820333330', 'Mr. Ramesh Malhotra', '+91 9730333330', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_031', 'Arjun Gupta', 'arjun.gupta31@example.com', '+91 9820344441', 'Mr. Ramesh Gupta', '+91 9730344441', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_032', 'Shreya Deshmukh', 'shreya.deshmukh32@example.com', '+91 9820355552', 'Mr. Ramesh Deshmukh', '+91 9730355552', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_pydata', '2026-10-16 12:11:02'),
  ('s_033', 'Sachin Patel', 'sachin.patel33@example.com', '+91 9820366663', 'Mr. Ramesh Patel', '+91 9730366663', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_034', 'Anjali Nair', 'anjali.nair34@example.com', '+91 9820377774', 'Mr. Ramesh Nair', '+91 9730377774', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_035', 'Mayank Verma', 'mayank.verma35@example.com', '+91 9820388885', 'Mr. Ramesh Verma', '+91 9730388885', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_036', 'Sonali Kulkarni', 'sonali.kulkarni36@example.com', '+91 9820399996', 'Mr. Ramesh Kulkarni', '+91 9730399996', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_037', 'Vivek Sharma', 'vivek.sharma37@example.com', '+91 9820411107', 'Mr. Ramesh Sharma', '+91 9730411107', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_038', 'Sneha Verma', 'sneha.verma38@example.com', '+91 9820422218', 'Mr. Ramesh Verma', '+91 9730422218', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_039', 'Pranav Rao', 'pranav.rao39@example.com', '+91 9820433329', 'Mr. Ramesh Rao', '+91 9730433329', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_040', 'Ritu Joshi', 'ritu.joshi40@example.com', '+91 9820444440', 'Mr. Ramesh Joshi', '+91 9730444440', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_mern', '2026-10-16 12:11:02'),
  ('s_041', 'Abhishek Iyer', 'abhishek.iyer41@example.com', '+91 9820455551', 'Mr. Ramesh Iyer', '+91 9730455551', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_042', 'Monika Chatterjee', 'monika.chatterjee42@example.com', '+91 9820466662', 'Mr. Ramesh Chatterjee', '+91 9730466662', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_043', 'Dev Reddy', 'dev.reddy43@example.com', '+91 9820477773', 'Mr. Ramesh Reddy', '+91 9730477773', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_044', 'Aditi Chauhan', 'aditi.chauhan44@example.com', '+91 9820488884', 'Mr. Ramesh Chauhan', '+91 9730488884', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_045', 'Alok Bhatia', 'alok.bhatia45@example.com', '+91 9820499995', 'Mr. Ramesh Bhatia', '+91 9730499995', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_046', 'Bhavna Mishra', 'bhavna.mishra46@example.com', '+91 9820511106', 'Mr. Ramesh Mishra', '+91 9730511106', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_047', 'Chetan Singh', 'chetan.singh47@example.com', '+91 9820522217', 'Mr. Ramesh Singh', '+91 9730522217', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_048', 'Geeta Agarwal', 'geeta.agarwal48@example.com', '+91 9820533328', 'Mr. Ramesh Agarwal', '+91 9730533328', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_aiml', '2026-10-16 12:11:02'),
  ('s_049', 'Dhiraj Pillai', 'dhiraj.pillai49@example.com', '+91 9820544439', 'Mr. Ramesh Pillai', '+91 9730544439', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02'),
  ('s_050', 'Hema Pandey', 'hema.pandey50@example.com', '+91 9820555550', 'Mr. Ramesh Pandey', '+91 9730555550', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."students" ("id", "name", "email", "phone", "guardian_name", "guardian_phone", "city", "college", "join_date", "status", "notes", "created_at")
VALUES
  ('s_051', 'Siddharth Kulkarni', 'siddharth.kulkarni51@example.com', '+91 9820566661', 'Mr. Ramesh Kulkarni', '+91 9730566661', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02'),
  ('s_052', 'Kiran Bose', 'kiran.bose52@example.com', '+91 9820577772', 'Mr. Ramesh Bose', '+91 9730577772', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02'),
  ('s_053', 'Lalit Shah', 'lalit.shah53@example.com', '+91 9820588883', 'Mr. Ramesh Shah', '+91 9730588883', 'Nashik', 'RVCE', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02'),
  ('s_054', 'Mansi Nambiar', 'mansi.nambiar54@example.com', '+91 9820599994', 'Mr. Ramesh Nambiar', '+91 9730599994', 'Indore', 'VIT Vellore', '2026-08-25', 'active', 'Enrolled for c_iot', '2026-10-16 12:11:02'),
  ('s_055', 'Mohit Shukla', 'mohit.shukla55@example.com', '+91 9820611105', 'Mr. Ramesh Shukla', '+91 9730611105', 'Ahmedabad', 'DY Patil', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_056', 'Nandini Yadav', 'nandini.yadav56@example.com', '+91 9820622216', 'Mr. Ramesh Yadav', '+91 9730622216', 'Pune', 'COEP Tech', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_057', 'Omkar Saxena', 'omkar.saxena57@example.com', '+91 9820633327', 'Mr. Ramesh Saxena', '+91 9730633327', 'Mumbai', 'VJTI Mumbai', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_058', 'Payal Choudhury', 'payal.choudhury58@example.com', '+91 9820644438', 'Mr. Ramesh Choudhury', '+91 9730644438', 'Bengaluru', 'MIT-WPU', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_059', 'Raj Ghosh', 'raj.ghosh59@example.com', '+91 9820655549', 'Mr. Ramesh Ghosh', '+91 9730655549', 'Hyderabad', 'PICT Pune', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_060', 'Sandhya Malhotra', 'sandhya.malhotra60@example.com', '+91 9820666660', 'Mr. Ramesh Malhotra', '+91 9730666660', 'Nagpur', 'BMS College', '2026-08-25', 'active', 'Enrolled for c_dbms', '2026-10-16 12:11:02'),
  ('s_1792192417497', 'Yash Vardhan', 'yash.vardhan@example.com', '+91 9820999888', 'Mrs. Sunita Suresh Vardhan', '+91 9820777999', 'Pune', NULL, '2026-10-16', 'active', NULL, '2026-10-16 23:13:37'),
  ('s_1792192583926', 'Pooja Hegde', 'pooja.hegde@example.com', '+91 9820555444', 'Mrs. Shailaja Manjunath Hegde', '+91 9820111333', 'Bengaluru', NULL, '2026-10-16', 'active', NULL, '2026-10-16 23:16:23'),
  ('s_1792192782768', 'krushna waghmare', 'krushna@gmail.com', '+91 9028731400', 'sanjay', '+91 9028551400', 'Pune', NULL, '2026-10-16', 'active', NULL, '2026-10-16 23:19:42'),
  ('s_1792193048533', 'sudhanshu tekale ', 'sud@gmail.com', '+91 9028731400', 'eknath tekale', '+91 9028551400', 'Pune', NULL, '2026-10-16', 'active', NULL, '2026-10-16 23:24:08'),
  ('s_1792210727742', 'sakshi', 'sakshi@gmail.com', '+91 9028731400', 'ritu', '+91 9028551400', 'Pune', NULL, '2026-10-17', 'active', NULL, '2026-10-17 04:18:47'),
  ('s_1793077978100', 'adi', 'ss@gmail.com', '+91 3234455677', 'examole', '+912334456667', 'Pune', NULL, '2026-10-27', 'active', NULL, '2026-10-27 05:12:58')
ON CONFLICT (id) DO NOTHING;

-- Table: enrollments (66 rows)
INSERT INTO public."enrollments" ("id", "student_id", "batch_id", "enrolled_at", "preferred_mode", "status")
VALUES
  ('enr_1', 's_001', 'b_java_m1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_2', 's_002', 'b_java_m1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_3', 's_003', 'b_java_m1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_4', 's_004', 'b_java_m1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_5', 's_005', 'b_java_m1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_6', 's_006', 'b_java_m1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_7', 's_007', 'b_java_m1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_8', 's_008', 'b_java_m1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_9', 's_009', 'b_java_m1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_10', 's_010', 'b_java_m1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_11', 's_011', 'b_java_fast', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_12', 's_012', 'b_java_fast', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_13', 's_013', 'b_java_fast', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_14', 's_014', 'b_java_fast', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_15', 's_015', 'b_java_fast', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_16', 's_016', 'b_java_fast', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_17', 's_017', 'b_java_fast', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_18', 's_018', 'b_java_e1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_19', 's_019', 'b_java_e1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_20', 's_020', 'b_java_e1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_21', 's_021', 'b_java_e1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_22', 's_022', 'b_java_e1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_23', 's_023', 'b_java_e1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_24', 's_024', 'b_java_e1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_25', 's_025', 'b_py_m2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_26', 's_026', 'b_py_m2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_27', 's_027', 'b_py_m2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_28', 's_028', 'b_py_m2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_29', 's_029', 'b_py_m2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_30', 's_030', 'b_py_m2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_31', 's_031', 'b_py_m2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_32', 's_032', 'b_py_m2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_33', 's_033', 'b_mern_e2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_34', 's_034', 'b_mern_e2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_35', 's_035', 'b_mern_e2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_36', 's_036', 'b_mern_e2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_37', 's_037', 'b_mern_e2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_38', 's_038', 'b_mern_e2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_39', 's_039', 'b_mern_e2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_40', 's_040', 'b_mern_e2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_41', 's_041', 'b_ai_w2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_42', 's_042', 'b_ai_w2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_43', 's_043', 'b_ai_w2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_44', 's_044', 'b_ai_w2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_45', 's_045', 'b_ai_w2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_46', 's_046', 'b_ai_w2', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_47', 's_047', 'b_ai_w2', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_48', 's_048', 'b_ai_w2', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_49', 's_049', 'b_iot_m3', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_50', 's_050', 'b_iot_m3', '2026-08-28 10:00:00', 'classroom', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."enrollments" ("id", "student_id", "batch_id", "enrolled_at", "preferred_mode", "status")
VALUES
  ('enr_51', 's_051', 'b_iot_m3', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_52', 's_052', 'b_iot_m3', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_53', 's_053', 'b_iot_m3', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_54', 's_054', 'b_iot_m3', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_55', 's_055', 'b_dbms_w1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_56', 's_056', 'b_dbms_w1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_57', 's_057', 'b_dbms_w1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_58', 's_058', 'b_dbms_w1', '2026-08-28 10:00:00', 'classroom', 'active'),
  ('enr_59', 's_059', 'b_dbms_w1', '2026-08-28 10:00:00', 'hybrid', 'active'),
  ('enr_60', 's_060', 'b_dbms_w1', '2026-08-28 10:00:00', 'online', 'active'),
  ('enr_1792192417501', 's_1792192417497', 'b_java_m1', '2026-10-16 23:13:37', 'hybrid', 'active'),
  ('enr_1792192583926', 's_1792192583926', 'b_mern_e2', '2026-10-16 23:16:23', 'hybrid', 'active'),
  ('enr_1792192782768', 's_1792192782768', 'b_iot_m3', '2026-10-16 23:19:42', 'hybrid', 'active'),
  ('enr_1792193048533', 's_1792193048533', 'b_dbms_w1', '2026-10-16 23:24:08', 'hybrid', 'active'),
  ('enr_1792210727743', 's_1792210727742', 'b_py_m2', '2026-10-17 04:18:47', 'hybrid', 'active'),
  ('enr_1793077978101', 's_1793077978100', 'b_java_m1', '2026-10-27 05:12:58', 'hybrid', 'active')
ON CONFLICT (id) DO NOTHING;

-- Table: fee_plans (66 rows)
INSERT INTO public."fee_plans" ("id", "student_id", "course_id", "total_amount", "down_payment", "num_installments", "discount", "notes", "created_at")
VALUES
  ('fp_1', 's_001', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_2', 's_002', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_3', 's_003', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_4', 's_004', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_5', 's_005', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_6', 's_006', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_7', 's_007', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_8', 's_008', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_9', 's_009', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_10', 's_010', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_11', 's_011', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_12', 's_012', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_13', 's_013', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_14', 's_014', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_15', 's_015', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_16', 's_016', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_17', 's_017', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_18', 's_018', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_19', 's_019', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_20', 's_020', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_21', 's_021', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_22', 's_022', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_23', 's_023', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_24', 's_024', 'c_java', 45000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_25', 's_025', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_26', 's_026', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_27', 's_027', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_28', 's_028', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_29', 's_029', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_30', 's_030', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_31', 's_031', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_32', 's_032', 'c_pydata', 38000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_33', 's_033', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_34', 's_034', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_35', 's_035', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_36', 's_036', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_37', 's_037', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_38', 's_038', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_39', 's_039', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_40', 's_040', 'c_mern', 42000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_41', 's_041', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_42', 's_042', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_43', 's_043', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_44', 's_044', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_45', 's_045', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_46', 's_046', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_47', 's_047', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_48', 's_048', 'c_aiml', 52000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_49', 's_049', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_50', 's_050', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."fee_plans" ("id", "student_id", "course_id", "total_amount", "down_payment", "num_installments", "discount", "notes", "created_at")
VALUES
  ('fp_51', 's_051', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_52', 's_052', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_53', 's_053', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_54', 's_054', 'c_iot', 36000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_55', 's_055', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_56', 's_056', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_57', 's_057', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_58', 's_058', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_59', 's_059', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_60', 's_060', 'c_dbms', 25000.0, 10000.0, 3, 0.0, 'Standard 3-EMI plan', '2026-10-16 12:11:02'),
  ('fp_1792192417501', 's_1792192417497', 'c_java', 45000.0, 10000.0, 2, 0.0, NULL, '2026-10-16 23:13:37'),
  ('fp_1792192583926', 's_1792192583926', 'c_mern', 42000.0, 10000.0, 2, 0.0, NULL, '2026-10-16 23:16:23'),
  ('fp_1792192782768', 's_1792192782768', 'c_iot', 36000.0, 10000.0, 2, 0.0, NULL, '2026-10-16 23:19:42'),
  ('fp_1792193048533', 's_1792193048533', 'c_dbms', 25000.0, 10000.0, 2, 0.0, NULL, '2026-10-16 23:24:08'),
  ('fp_1792210727743', 's_1792210727742', 'c_pydata', 38000.0, 10000.0, 2, 0.0, NULL, '2026-10-17 04:18:47'),
  ('fp_1793077978102', 's_1793077978100', 'c_java', 45000.0, 10000.0, 2, 0.0, NULL, '2026-10-27 05:12:58')
ON CONFLICT (id) DO NOTHING;

-- Table: emi_installments (192 rows)
INSERT INTO public."emi_installments" ("id", "fee_plan_id", "student_id", "installment_no", "due_date", "amount", "status", "paid_date", "created_at")
VALUES
  ('emi_1_1', 'fp_1', 's_001', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_1_2', 'fp_1', 's_001', 2, '2026-10-25', 11667.0, 'paid', '2026-10-17', '2026-10-16 12:11:02'),
  ('emi_1_3', 'fp_1', 's_001', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_2_1', 'fp_2', 's_002', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_2_2', 'fp_2', 's_002', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_2_3', 'fp_2', 's_002', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_3_1', 'fp_3', 's_003', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_3_2', 'fp_3', 's_003', 2, '2026-10-19', 11667.0, 'paid', '2026-10-17', '2026-10-16 12:11:02'),
  ('emi_3_3', 'fp_3', 's_003', 3, '2026-11-15', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_4_1', 'fp_4', 's_004', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_4_2', 'fp_4', 's_004', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_4_3', 'fp_4', 's_004', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_5_1', 'fp_5', 's_005', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_5_2', 'fp_5', 's_005', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_5_3', 'fp_5', 's_005', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_6_1', 'fp_6', 's_006', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_6_2', 'fp_6', 's_006', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_6_3', 'fp_6', 's_006', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_7_1', 'fp_7', 's_007', 1, '2026-09-15', 11667.0, 'paid', '2026-09-15', '2026-10-16 12:11:02'),
  ('emi_7_2', 'fp_7', 's_007', 2, '2026-10-18', 11667.0, 'paid', '2026-10-17', '2026-10-16 12:11:02'),
  ('emi_7_3', 'fp_7', 's_007', 3, '2026-11-15', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_8_1', 'fp_8', 's_008', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_8_2', 'fp_8', 's_008', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_8_3', 'fp_8', 's_008', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_9_1', 'fp_9', 's_009', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_9_2', 'fp_9', 's_009', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_9_3', 'fp_9', 's_009', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_10_1', 'fp_10', 's_010', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_10_2', 'fp_10', 's_010', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_10_3', 'fp_10', 's_010', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_11_1', 'fp_11', 's_011', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_11_2', 'fp_11', 's_011', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_11_3', 'fp_11', 's_011', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_12_1', 'fp_12', 's_012', 1, '2026-09-15', 11667.0, 'overdue', NULL, '2026-10-16 12:11:02'),
  ('emi_12_2', 'fp_12', 's_012', 2, '2026-10-12', 11667.0, 'overdue', NULL, '2026-10-16 12:11:02'),
  ('emi_12_3', 'fp_12', 's_012', 3, '2026-11-15', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_13_1', 'fp_13', 's_013', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_13_2', 'fp_13', 's_013', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_13_3', 'fp_13', 's_013', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_14_1', 'fp_14', 's_014', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_14_2', 'fp_14', 's_014', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_14_3', 'fp_14', 's_014', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_15_1', 'fp_15', 's_015', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_15_2', 'fp_15', 's_015', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_15_3', 'fp_15', 's_015', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_16_1', 'fp_16', 's_016', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_16_2', 'fp_16', 's_016', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_16_3', 'fp_16', 's_016', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_17_1', 'fp_17', 's_017', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_17_2', 'fp_17', 's_017', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."emi_installments" ("id", "fee_plan_id", "student_id", "installment_no", "due_date", "amount", "status", "paid_date", "created_at")
VALUES
  ('emi_17_3', 'fp_17', 's_017', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_18_1', 'fp_18', 's_018', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_18_2', 'fp_18', 's_018', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_18_3', 'fp_18', 's_018', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_19_1', 'fp_19', 's_019', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_19_2', 'fp_19', 's_019', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_19_3', 'fp_19', 's_019', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_20_1', 'fp_20', 's_020', 1, '2026-09-15', 11667.0, 'paid', '2026-09-14', '2026-10-16 12:11:02'),
  ('emi_20_2', 'fp_20', 's_020', 2, '2026-10-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_20_3', 'fp_20', 's_020', 3, '2026-11-25', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_21_1', 'fp_21', 's_021', 1, '2026-09-15', 11667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_21_2', 'fp_21', 's_021', 2, '2026-10-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_21_3', 'fp_21', 's_021', 3, '2026-11-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_22_1', 'fp_22', 's_022', 1, '2026-09-15', 11667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_22_2', 'fp_22', 's_022', 2, '2026-10-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_22_3', 'fp_22', 's_022', 3, '2026-11-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_23_1', 'fp_23', 's_023', 1, '2026-09-15', 11667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_23_2', 'fp_23', 's_023', 2, '2026-10-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_23_3', 'fp_23', 's_023', 3, '2026-11-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_24_1', 'fp_24', 's_024', 1, '2026-09-15', 11667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_24_2', 'fp_24', 's_024', 2, '2026-10-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_24_3', 'fp_24', 's_024', 3, '2026-11-28', 11667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_25_1', 'fp_25', 's_025', 1, '2026-09-15', 9333.0, 'overdue', NULL, '2026-10-16 12:11:02'),
  ('emi_25_2', 'fp_25', 's_025', 2, '2026-10-18', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_25_3', 'fp_25', 's_025', 3, '2026-11-15', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_26_1', 'fp_26', 's_026', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_26_2', 'fp_26', 's_026', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_26_3', 'fp_26', 's_026', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_27_1', 'fp_27', 's_027', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_27_2', 'fp_27', 's_027', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_27_3', 'fp_27', 's_027', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_28_1', 'fp_28', 's_028', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_28_2', 'fp_28', 's_028', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_28_3', 'fp_28', 's_028', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_29_1', 'fp_29', 's_029', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_29_2', 'fp_29', 's_029', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_29_3', 'fp_29', 's_029', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_30_1', 'fp_30', 's_030', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_30_2', 'fp_30', 's_030', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_30_3', 'fp_30', 's_030', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_31_1', 'fp_31', 's_031', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_31_2', 'fp_31', 's_031', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_31_3', 'fp_31', 's_031', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_32_1', 'fp_32', 's_032', 1, '2026-09-15', 9333.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_32_2', 'fp_32', 's_032', 2, '2026-10-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_32_3', 'fp_32', 's_032', 3, '2026-11-28', 9333.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_33_1', 'fp_33', 's_033', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_33_2', 'fp_33', 's_033', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_33_3', 'fp_33', 's_033', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_34_1', 'fp_34', 's_034', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."emi_installments" ("id", "fee_plan_id", "student_id", "installment_no", "due_date", "amount", "status", "paid_date", "created_at")
VALUES
  ('emi_34_2', 'fp_34', 's_034', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_34_3', 'fp_34', 's_034', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_35_1', 'fp_35', 's_035', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_35_2', 'fp_35', 's_035', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_35_3', 'fp_35', 's_035', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_36_1', 'fp_36', 's_036', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_36_2', 'fp_36', 's_036', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_36_3', 'fp_36', 's_036', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_37_1', 'fp_37', 's_037', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_37_2', 'fp_37', 's_037', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_37_3', 'fp_37', 's_037', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_38_1', 'fp_38', 's_038', 1, '2026-09-15', 10667.0, 'overdue', NULL, '2026-10-16 12:11:02'),
  ('emi_38_2', 'fp_38', 's_038', 2, '2026-10-18', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_38_3', 'fp_38', 's_038', 3, '2026-11-15', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_39_1', 'fp_39', 's_039', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_39_2', 'fp_39', 's_039', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_39_3', 'fp_39', 's_039', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_40_1', 'fp_40', 's_040', 1, '2026-09-15', 10667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_40_2', 'fp_40', 's_040', 2, '2026-10-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_40_3', 'fp_40', 's_040', 3, '2026-11-28', 10667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_41_1', 'fp_41', 's_041', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_41_2', 'fp_41', 's_041', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_41_3', 'fp_41', 's_041', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_42_1', 'fp_42', 's_042', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_42_2', 'fp_42', 's_042', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_42_3', 'fp_42', 's_042', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_43_1', 'fp_43', 's_043', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_43_2', 'fp_43', 's_043', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_43_3', 'fp_43', 's_043', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_44_1', 'fp_44', 's_044', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_44_2', 'fp_44', 's_044', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_44_3', 'fp_44', 's_044', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_45_1', 'fp_45', 's_045', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_45_2', 'fp_45', 's_045', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_45_3', 'fp_45', 's_045', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_46_1', 'fp_46', 's_046', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_46_2', 'fp_46', 's_046', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_46_3', 'fp_46', 's_046', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_47_1', 'fp_47', 's_047', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_47_2', 'fp_47', 's_047', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_47_3', 'fp_47', 's_047', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_48_1', 'fp_48', 's_048', 1, '2026-09-15', 14000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_48_2', 'fp_48', 's_048', 2, '2026-10-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_48_3', 'fp_48', 's_048', 3, '2026-11-28', 14000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_49_1', 'fp_49', 's_049', 1, '2026-09-15', 8667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_49_2', 'fp_49', 's_049', 2, '2026-10-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_49_3', 'fp_49', 's_049', 3, '2026-11-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_50_1', 'fp_50', 's_050', 1, '2026-09-15', 8667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_50_2', 'fp_50', 's_050', 2, '2026-10-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_50_3', 'fp_50', 's_050', 3, '2026-11-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."emi_installments" ("id", "fee_plan_id", "student_id", "installment_no", "due_date", "amount", "status", "paid_date", "created_at")
VALUES
  ('emi_51_1', 'fp_51', 's_051', 1, '2026-09-15', 8667.0, 'overdue', NULL, '2026-10-16 12:11:02'),
  ('emi_51_2', 'fp_51', 's_051', 2, '2026-10-18', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_51_3', 'fp_51', 's_051', 3, '2026-11-15', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_52_1', 'fp_52', 's_052', 1, '2026-09-15', 8667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_52_2', 'fp_52', 's_052', 2, '2026-10-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_52_3', 'fp_52', 's_052', 3, '2026-11-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_53_1', 'fp_53', 's_053', 1, '2026-09-15', 8667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_53_2', 'fp_53', 's_053', 2, '2026-10-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_53_3', 'fp_53', 's_053', 3, '2026-11-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_54_1', 'fp_54', 's_054', 1, '2026-09-15', 8667.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_54_2', 'fp_54', 's_054', 2, '2026-10-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_54_3', 'fp_54', 's_054', 3, '2026-11-28', 8667.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_55_1', 'fp_55', 's_055', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_55_2', 'fp_55', 's_055', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_55_3', 'fp_55', 's_055', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_56_1', 'fp_56', 's_056', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_56_2', 'fp_56', 's_056', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_56_3', 'fp_56', 's_056', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_57_1', 'fp_57', 's_057', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_57_2', 'fp_57', 's_057', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_57_3', 'fp_57', 's_057', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_58_1', 'fp_58', 's_058', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_58_2', 'fp_58', 's_058', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_58_3', 'fp_58', 's_058', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_59_1', 'fp_59', 's_059', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_59_2', 'fp_59', 's_059', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_59_3', 'fp_59', 's_059', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_60_1', 'fp_60', 's_060', 1, '2026-09-15', 5000.0, 'paid', '2026-09-10', '2026-10-16 12:11:02'),
  ('emi_60_2', 'fp_60', 's_060', 2, '2026-10-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_60_3', 'fp_60', 's_060', 3, '2026-11-28', 5000.0, 'pending', NULL, '2026-10-16 12:11:02'),
  ('emi_1792192417501_1', 'fp_1792192417501', 's_1792192417497', 1, '2026-11-15', 17500.0, 'pending', NULL, '2026-10-16 23:13:37'),
  ('emi_1792192417501_2', 'fp_1792192417501', 's_1792192417497', 2, '2026-12-15', 17500.0, 'pending', NULL, '2026-10-16 23:13:37'),
  ('emi_1792192583926_1', 'fp_1792192583926', 's_1792192583926', 1, '2026-11-15', 16000.0, 'pending', NULL, '2026-10-16 23:16:23'),
  ('emi_1792192583926_2', 'fp_1792192583926', 's_1792192583926', 2, '2026-12-15', 16000.0, 'pending', NULL, '2026-10-16 23:16:23'),
  ('emi_1792192782769_1', 'fp_1792192782768', 's_1792192782768', 1, '2026-11-15', 13000.0, 'pending', NULL, '2026-10-16 23:19:42'),
  ('emi_1792192782769_2', 'fp_1792192782768', 's_1792192782768', 2, '2026-12-15', 13000.0, 'pending', NULL, '2026-10-16 23:19:42'),
  ('emi_1792193048533_1', 'fp_1792193048533', 's_1792193048533', 1, '2026-11-15', 7500.0, 'pending', NULL, '2026-10-16 23:24:08'),
  ('emi_1792193048533_2', 'fp_1792193048533', 's_1792193048533', 2, '2026-12-15', 7500.0, 'pending', NULL, '2026-10-16 23:24:08'),
  ('emi_1792210727743_1', 'fp_1792210727743', 's_1792210727742', 1, '2026-11-16', 14000.0, 'pending', NULL, '2026-10-17 04:18:47'),
  ('emi_1792210727743_2', 'fp_1792210727743', 's_1792210727742', 2, '2026-12-16', 14000.0, 'pending', NULL, '2026-10-17 04:18:47'),
  ('emi_1793077978102_1', 'fp_1793077978102', 's_1793077978100', 1, '2026-11-26', 17500.0, 'pending', NULL, '2026-10-27 05:12:58'),
  ('emi_1793077978102_2', 'fp_1793077978102', 's_1793077978100', 2, '2026-12-26', 17500.0, 'pending', NULL, '2026-10-27 05:12:58')
ON CONFLICT (id) DO NOTHING;

-- Table: payments (125 rows)
INSERT INTO public."payments" ("id", "emi_id", "student_id", "source", "reference", "amount", "date", "notes", "status", "created_at")
VALUES
  ('pay_dp_1', NULL, 's_001', 'upi', 'UPI/YESB/90000001', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_1_1', 'emi_1_1', 's_001', 'upi', 'UPI/SBI/80000001', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_2', NULL, 's_002', 'upi', 'UPI/YESB/90000002', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_2_1', 'emi_2_1', 's_002', 'upi', 'UPI/SBI/80000002', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_3', NULL, 's_003', 'upi', 'UPI/YESB/90000003', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_3_1', 'emi_3_1', 's_003', 'upi', 'UPI/HDFC/80000003', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_4', NULL, 's_004', 'upi', 'UPI/YESB/90000004', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_4_1', 'emi_4_1', 's_004', 'upi', 'UPI/SBI/80000004', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_5', NULL, 's_005', 'upi', 'UPI/YESB/90000005', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_5_1', 'emi_5_1', 's_005', 'upi', 'UPI/SBI/80000005', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_6', NULL, 's_006', 'upi', 'UPI/YESB/90000006', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_6_1', 'emi_6_1', 's_006', 'upi', 'UPI/SBI/80000006', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_7', NULL, 's_007', 'upi', 'UPI/YESB/90000007', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_7_1', 'emi_7_1', 's_007', 'bank', 'NEFT/ICIC/80000007', 11667.0, '2026-09-15', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_8', NULL, 's_008', 'upi', 'UPI/YESB/90000008', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_8_1', 'emi_8_1', 's_008', 'upi', 'UPI/SBI/80000008', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_9', NULL, 's_009', 'upi', 'UPI/YESB/90000009', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_9_1', 'emi_9_1', 's_009', 'upi', 'UPI/SBI/80000009', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_10', NULL, 's_010', 'upi', 'UPI/YESB/90000010', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_10_1', 'emi_10_1', 's_010', 'upi', 'UPI/SBI/80000010', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_11', NULL, 's_011', 'upi', 'UPI/YESB/90000011', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_11_1', 'emi_11_1', 's_011', 'upi', 'UPI/SBI/80000011', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_12', NULL, 's_012', 'upi', 'UPI/YESB/90000012', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_13', NULL, 's_013', 'upi', 'UPI/YESB/90000013', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_13_1', 'emi_13_1', 's_013', 'upi', 'UPI/SBI/80000013', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_14', NULL, 's_014', 'upi', 'UPI/YESB/90000014', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_14_1', 'emi_14_1', 's_014', 'upi', 'UPI/SBI/80000014', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_15', NULL, 's_015', 'upi', 'UPI/YESB/90000015', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_15_1', 'emi_15_1', 's_015', 'upi', 'UPI/SBI/80000015', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_16', NULL, 's_016', 'upi', 'UPI/YESB/90000016', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_16_1', 'emi_16_1', 's_016', 'upi', 'UPI/SBI/80000016', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_17', NULL, 's_017', 'upi', 'UPI/YESB/90000017', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_17_1', 'emi_17_1', 's_017', 'upi', 'UPI/SBI/80000017', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_18', NULL, 's_018', 'upi', 'UPI/YESB/90000018', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_18_1', 'emi_18_1', 's_018', 'upi', 'UPI/SBI/80000018', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_19', NULL, 's_019', 'upi', 'UPI/YESB/90000019', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_19_1', 'emi_19_1', 's_019', 'upi', 'UPI/SBI/80000019', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_20', NULL, 's_020', 'upi', 'UPI/YESB/90000020', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_20_1', 'emi_20_1', 's_020', 'upi', 'UPI/SBI/80000020', 11667.0, '2026-09-14', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_21', NULL, 's_021', 'upi', 'UPI/YESB/90000021', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_21_1', 'emi_21_1', 's_021', 'upi', 'UPI/PAYTM/80000021', 11667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_22', NULL, 's_022', 'upi', 'UPI/YESB/90000022', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_22_1', 'emi_22_1', 's_022', 'upi', 'UPI/PAYTM/80000022', 11667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_23', NULL, 's_023', 'upi', 'UPI/YESB/90000023', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_23_1', 'emi_23_1', 's_023', 'upi', 'UPI/PAYTM/80000023', 11667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_24', NULL, 's_024', 'upi', 'UPI/YESB/90000024', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_24_1', 'emi_24_1', 's_024', 'upi', 'UPI/PAYTM/80000024', 11667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_25', NULL, 's_025', 'upi', 'UPI/YESB/90000025', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_26', NULL, 's_026', 'upi', 'UPI/YESB/90000026', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_26_1', 'emi_26_1', 's_026', 'upi', 'UPI/PAYTM/80000026', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."payments" ("id", "emi_id", "student_id", "source", "reference", "amount", "date", "notes", "status", "created_at")
VALUES
  ('pay_dp_27', NULL, 's_027', 'upi', 'UPI/YESB/90000027', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_27_1', 'emi_27_1', 's_027', 'upi', 'UPI/PAYTM/80000027', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_28', NULL, 's_028', 'upi', 'UPI/YESB/90000028', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_28_1', 'emi_28_1', 's_028', 'upi', 'UPI/PAYTM/80000028', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_29', NULL, 's_029', 'upi', 'UPI/YESB/90000029', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_29_1', 'emi_29_1', 's_029', 'upi', 'UPI/PAYTM/80000029', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_30', NULL, 's_030', 'upi', 'UPI/YESB/90000030', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_30_1', 'emi_30_1', 's_030', 'upi', 'UPI/PAYTM/80000030', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_31', NULL, 's_031', 'upi', 'UPI/YESB/90000031', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_31_1', 'emi_31_1', 's_031', 'upi', 'UPI/PAYTM/80000031', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_32', NULL, 's_032', 'upi', 'UPI/YESB/90000032', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_32_1', 'emi_32_1', 's_032', 'upi', 'UPI/PAYTM/80000032', 9333.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_33', NULL, 's_033', 'upi', 'UPI/YESB/90000033', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_33_1', 'emi_33_1', 's_033', 'upi', 'UPI/PAYTM/80000033', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_34', NULL, 's_034', 'upi', 'UPI/YESB/90000034', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_34_1', 'emi_34_1', 's_034', 'upi', 'UPI/PAYTM/80000034', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_35', NULL, 's_035', 'upi', 'UPI/YESB/90000035', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_35_1', 'emi_35_1', 's_035', 'upi', 'UPI/PAYTM/80000035', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_36', NULL, 's_036', 'upi', 'UPI/YESB/90000036', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_36_1', 'emi_36_1', 's_036', 'upi', 'UPI/PAYTM/80000036', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_37', NULL, 's_037', 'upi', 'UPI/YESB/90000037', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_37_1', 'emi_37_1', 's_037', 'upi', 'UPI/PAYTM/80000037', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_38', NULL, 's_038', 'upi', 'UPI/YESB/90000038', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_39', NULL, 's_039', 'upi', 'UPI/YESB/90000039', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_39_1', 'emi_39_1', 's_039', 'upi', 'UPI/PAYTM/80000039', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_40', NULL, 's_040', 'upi', 'UPI/YESB/90000040', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_40_1', 'emi_40_1', 's_040', 'upi', 'UPI/PAYTM/80000040', 10667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_41', NULL, 's_041', 'upi', 'UPI/YESB/90000041', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_41_1', 'emi_41_1', 's_041', 'upi', 'UPI/PAYTM/80000041', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_42', NULL, 's_042', 'upi', 'UPI/YESB/90000042', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_42_1', 'emi_42_1', 's_042', 'upi', 'UPI/PAYTM/80000042', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_43', NULL, 's_043', 'upi', 'UPI/YESB/90000043', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_43_1', 'emi_43_1', 's_043', 'upi', 'UPI/PAYTM/80000043', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_44', NULL, 's_044', 'upi', 'UPI/YESB/90000044', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_44_1', 'emi_44_1', 's_044', 'upi', 'UPI/PAYTM/80000044', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_45', NULL, 's_045', 'upi', 'UPI/YESB/90000045', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_45_1', 'emi_45_1', 's_045', 'upi', 'UPI/PAYTM/80000045', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_46', NULL, 's_046', 'upi', 'UPI/YESB/90000046', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_46_1', 'emi_46_1', 's_046', 'upi', 'UPI/PAYTM/80000046', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_47', NULL, 's_047', 'upi', 'UPI/YESB/90000047', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_47_1', 'emi_47_1', 's_047', 'upi', 'UPI/PAYTM/80000047', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_48', NULL, 's_048', 'upi', 'UPI/YESB/90000048', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_48_1', 'emi_48_1', 's_048', 'upi', 'UPI/PAYTM/80000048', 14000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_49', NULL, 's_049', 'upi', 'UPI/YESB/90000049', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_49_1', 'emi_49_1', 's_049', 'upi', 'UPI/PAYTM/80000049', 8667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_50', NULL, 's_050', 'upi', 'UPI/YESB/90000050', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_50_1', 'emi_50_1', 's_050', 'upi', 'UPI/PAYTM/80000050', 8667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_51', NULL, 's_051', 'upi', 'UPI/YESB/90000051', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_52', NULL, 's_052', 'upi', 'UPI/YESB/90000052', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_52_1', 'emi_52_1', 's_052', 'upi', 'UPI/PAYTM/80000052', 8667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."payments" ("id", "emi_id", "student_id", "source", "reference", "amount", "date", "notes", "status", "created_at")
VALUES
  ('pay_dp_53', NULL, 's_053', 'upi', 'UPI/YESB/90000053', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_53_1', 'emi_53_1', 's_053', 'upi', 'UPI/PAYTM/80000053', 8667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_54', NULL, 's_054', 'upi', 'UPI/YESB/90000054', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_54_1', 'emi_54_1', 's_054', 'upi', 'UPI/PAYTM/80000054', 8667.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_55', NULL, 's_055', 'upi', 'UPI/YESB/90000055', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_55_1', 'emi_55_1', 's_055', 'upi', 'UPI/PAYTM/80000055', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_56', NULL, 's_056', 'upi', 'UPI/YESB/90000056', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_56_1', 'emi_56_1', 's_056', 'upi', 'UPI/PAYTM/80000056', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_57', NULL, 's_057', 'upi', 'UPI/YESB/90000057', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_57_1', 'emi_57_1', 's_057', 'upi', 'UPI/PAYTM/80000057', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_58', NULL, 's_058', 'upi', 'UPI/YESB/90000058', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_58_1', 'emi_58_1', 's_058', 'upi', 'UPI/PAYTM/80000058', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_59', NULL, 's_059', 'upi', 'UPI/YESB/90000059', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_59_1', 'emi_59_1', 's_059', 'upi', 'UPI/PAYTM/80000059', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_dp_60', NULL, 's_060', 'upi', 'UPI/YESB/90000060', 10000.0, '2026-08-28', 'Admission Down Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_emi_60_1', 'emi_60_1', 's_060', 'upi', 'UPI/PAYTM/80000060', 5000.0, '2026-09-10', 'EMI 1 Payment', 'verified', '2026-10-16 12:11:02'),
  ('pay_1792192417501', NULL, 's_1792192417497', 'upi', 'UPI/ADM/417501', 10000.0, '2026-10-16', 'Admission Down Payment', 'verified', '2026-10-16 23:13:37'),
  ('pay_1792192583926', NULL, 's_1792192583926', 'upi', 'UPI/ADM/583926', 10000.0, '2026-10-16', 'Admission Down Payment', 'verified', '2026-10-16 23:16:23'),
  ('pay_1792192782769', NULL, 's_1792192782768', 'upi', 'UPI/ADM/782769', 10000.0, '2026-10-16', 'Admission Down Payment', 'verified', '2026-10-16 23:19:42'),
  ('pay_1792193048533', NULL, 's_1792193048533', 'upi', 'UPI/ADM/048533', 10000.0, '2026-10-16', 'Admission Down Payment', 'verified', '2026-10-16 23:24:08'),
  ('pay_1792210727743', NULL, 's_1792210727742', 'upi', 'UPI/ADM/727743', 10000.0, '2026-10-17', 'Admission Down Payment', 'verified', '2026-10-17 04:18:47'),
  ('pay_verified_1792218766459', 'emi_1_2', 's_001', 'upi', 'UPI/GPY/987162534019', 11667.0, '2026-10-17', 'Owner verified photo proof (UTR: UPI/GPY/987162534019)', 'verified', '2026-10-17 06:32:46'),
  ('pay_verified_1792229822176', 'emi_7_2', 's_007', 'upi', 'UPI/ICIC/471029481023', 11667.0, '2026-10-17', 'Owner verified photo proof (UTR: UPI/ICIC/471029481023)', 'verified', '2026-10-17 09:37:02'),
  ('pay_verified_1792229947761', 'emi_3_2', 's_003', 'upi', 'UPI/HDFC/982731827419', 11667.0, '2026-10-17', 'Owner verified photo proof (UTR: UPI/HDFC/982731827419)', 'verified', '2026-10-17 09:39:07'),
  ('pay_1793077978102', NULL, 's_1793077978100', 'upi', 'UPI/ADM/978102', 10000.0, '2026-10-27', 'Admission Down Payment', 'verified', '2026-10-27 05:12:58')
ON CONFLICT (id) DO NOTHING;

-- Table: payment_proofs (3 rows)
INSERT INTO public."payment_proofs" ("id", "student_id", "emi_id", "amount", "reference", "proof_image_url", "payment_mode", "notes", "status", "rejection_reason", "verified_by", "verified_at", "created_at")
VALUES
  ('proof_rohan_1', 's_003', 'emi_3_2', 11667.0, 'UPI/HDFC/982731827419', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22600%22%20viewBox%3D%220%200%20400%20600%22%20fill%3D%22none%22%3E%0A%20%20%20%20%3Crect%20width%3D%22400%22%20height%3D%22600%22%20rx%3D%2224%22%20fill%3D%22%230F172A%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22360%22%20height%3D%22560%22%20rx%3D%2216%22%20fill%3D%22%231E293B%22%20stroke%3D%22%23334155%22%20stroke-width%3D%222%22%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%22200%22%20cy%3D%22110%22%20r%3D%2240%22%20fill%3D%22%23065F46%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M185%20110L195%20120L215%20100%22%20stroke%3D%22%2334D399%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20fill%3D%22%2394A3B8%22%20text-anchor%3D%22middle%22%3EPayment%20to%20InstiPilot%20Academy%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22225%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%20font-size%3D%2234%22%20fill%3D%22%23F8FAFC%22%20text-anchor%3D%22middle%22%3E%E2%82%B911%2C667.00%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22255%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20fill%3D%22%2334D399%22%20text-anchor%3D%22middle%22%3E%E2%9C%93%20Completed%20%E2%80%A2%2015%20Oct%202026%2C%2011%3A42%20AM%3C%2Ftext%3E%0A%20%20%20%20%3Cline%20x1%3D%2245%22%20y1%3D%22285%22%20x2%3D%22355%22%20y2%3D%22285%22%20stroke%3D%22%23334155%22%20stroke-width%3D%221.5%22%20stroke-dasharray%3D%224%204%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22325%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%2364748B%22%3EUPI%20Transaction%20ID%20(UTR)%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22348%22%20font-family%3D%22monospace%22%20font-size%3D%2214%22%20fill%3D%22%23E2E8F0%22%20font-weight%3D%22600%22%3EUPI%2FHDFC%2F982731827419%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22390%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%2364748B%22%3EPaid%20from%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22413%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%23E2E8F0%22%3ERohan%20Gupta%20(HDFC%20Bank%20%E2%80%A2%E2%80%A2%204918)%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22455%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%2364748B%22%3ETo%20UPI%20ID%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22478%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2338BDF8%22%3Einstipilot.academy%40hdfcbank%3C%2Ftext%3E%0A%20%20%20%20%3Crect%20x%3D%2245%22%20y%3D%22515%22%20width%3D%22310%22%20height%3D%2242%22%20rx%3D%228%22%20fill%3D%22%230F172A%22%20stroke%3D%22%23334155%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22541%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%2394A3B8%22%20text-anchor%3D%22middle%22%3EGoogle%20Pay%20Digital%20Receipt%20%E2%80%A2%20Verified%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E', 'upi', 'Paid via Google Pay, attaching screenshot for Owner verification', 'verified', NULL, 'u_owner', '2026-10-17 09:39:07', '2026-10-15 11:42:00'),
  ('proof_ananya_1', 's_007', 'emi_7_2', 11667.0, 'UPI/ICIC/471029481023', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22600%22%20viewBox%3D%220%200%20400%20600%22%20fill%3D%22none%22%3E%0A%20%20%20%20%3Crect%20width%3D%22400%22%20height%3D%22600%22%20rx%3D%2224%22%20fill%3D%22%230D1117%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%2220%22%20y%3D%2220%22%20width%3D%22360%22%20height%3D%22560%22%20rx%3D%2216%22%20fill%3D%22%23161B22%22%20stroke%3D%22%2330363D%22%20stroke-width%3D%222%22%2F%3E%0A%20%20%20%20%3Crect%20x%3D%22160%22%20y%3D%2270%22%20width%3D%2280%22%20height%3D%2280%22%20rx%3D%2220%22%20fill%3D%22%236739B7%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22M185%20110L195%20120L215%20100%22%20stroke%3D%22%23FFFFFF%22%20stroke-width%3D%225%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22185%22%20font-family%3D%22sans-serif%22%20font-size%3D%2215%22%20fill%3D%22%238B949E%22%20text-anchor%3D%22middle%22%3EPhonePe%20Transaction%20Successful%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22230%22%20font-family%3D%22sans-serif%22%20font-weight%3D%22bold%22%20font-size%3D%2234%22%20fill%3D%22%23F0F6FC%22%20text-anchor%3D%22middle%22%3E%E2%82%B911%2C667.00%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22260%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%20fill%3D%22%233FB950%22%20text-anchor%3D%22middle%22%3EPaid%20on%2016%20Oct%202026%2C%2003%3A15%20PM%3C%2Ftext%3E%0A%20%20%20%20%3Cline%20x1%3D%2245%22%20y1%3D%22290%22%20x2%3D%22355%22%20y2%3D%22290%22%20stroke%3D%22%2330363D%22%20stroke-width%3D%221.5%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22330%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%238B949E%22%3EBank%20Reference%20(UTR)%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22353%22%20font-family%3D%22monospace%22%20font-size%3D%2214%22%20fill%3D%22%23C9D1D9%22%20font-weight%3D%22600%22%3EUPI%2FICIC%2F471029481023%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22395%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%238B949E%22%3ESender%20Details%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22418%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%23C9D1D9%22%3EAnanya%20Deshmukh%20%E2%80%A2%20ICICI%20Bank%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22460%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%238B949E%22%3ERecipient%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20x%3D%2245%22%20y%3D%22483%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20fill%3D%22%2358A6FF%22%3Einstipilot.academy%40hdfcbank%3C%2Ftext%3E%0A%20%20%20%20%3Crect%20x%3D%2245%22%20y%3D%22515%22%20width%3D%22310%22%20height%3D%2242%22%20rx%3D%228%22%20fill%3D%22%2321262D%22%20stroke%3D%22%2330363D%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%22200%22%20y%3D%22541%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20fill%3D%22%238B949E%22%20text-anchor%3D%22middle%22%3EPhonePe%20UPI%20Reference%20Confirmed%3C%2Ftext%3E%0A%20%20%3C%2Fsvg%3E', 'upi', 'Installment #2 paid through PhonePe by father', 'verified', NULL, 'u_owner', '2026-10-17 09:37:02', '2026-10-16 15:15:00'),
  ('proof_1792218675733_klylb', 's_001', 'emi_1_2', 11667.0, 'UPI/GPY/987162534019', 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22600%22%3E%3Crect%20width%3D%22400%22%20height%3D%22600%22%20fill%3D%22%23111%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2250%22%20fill%3D%22%23fff%22%3EAarav%20UPI%3C%2Ftext%3E%3C%2Fsvg%3E', 'upi', 'Paid via GPay, please verify', 'verified', NULL, 'u_owner', '2026-10-17 06:32:46', '2026-10-17 06:32:46')
ON CONFLICT (id) DO NOTHING;

-- Table: attendance (540 rows)
INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_1', 's_001', 'b_java_m1', '2026-09-25', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_2', 's_001', 'b_java_m1', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_3', 's_001', 'b_java_m1', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_4', 's_001', 'b_java_m1', '2026-10-02', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_5', 's_001', 'b_java_m1', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_6', 's_001', 'b_java_m1', '2026-10-07', 'online', '08:02:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_7', 's_001', 'b_java_m1', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_8', 's_001', 'b_java_m1', '2026-10-12', 'online', '08:02:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_9', 's_001', 'b_java_m1', '2026-10-14', 'online', '20:09:34', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_10', 's_002', 'b_java_m1', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_11', 's_002', 'b_java_m1', '2026-09-28', 'classroom', '08:03:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_12', 's_002', 'b_java_m1', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_13', 's_002', 'b_java_m1', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_14', 's_002', 'b_java_m1', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_15', 's_002', 'b_java_m1', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_16', 's_002', 'b_java_m1', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_17', 's_002', 'b_java_m1', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_18', 's_002', 'b_java_m1', '2026-10-14', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_19', 's_003', 'b_java_m1', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_20', 's_003', 'b_java_m1', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_21', 's_003', 'b_java_m1', '2026-09-30', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_22', 's_003', 'b_java_m1', '2026-10-02', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_23', 's_003', 'b_java_m1', '2026-10-05', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_24', 's_003', 'b_java_m1', '2026-10-07', 'online', '08:04:22', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_25', 's_003', 'b_java_m1', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_26', 's_003', 'b_java_m1', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_27', 's_003', 'b_java_m1', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_28', 's_004', 'b_java_m1', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_29', 's_004', 'b_java_m1', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_30', 's_004', 'b_java_m1', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_31', 's_004', 'b_java_m1', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_32', 's_004', 'b_java_m1', '2026-10-05', 'classroom', '08:05:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_33', 's_004', 'b_java_m1', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_34', 's_004', 'b_java_m1', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_35', 's_004', 'b_java_m1', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_36', 's_004', 'b_java_m1', '2026-10-14', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_37', 's_005', 'b_java_m1', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_38', 's_005', 'b_java_m1', '2026-09-28', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_39', 's_005', 'b_java_m1', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_40', 's_005', 'b_java_m1', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_41', 's_005', 'b_java_m1', '2026-10-05', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_42', 's_005', 'b_java_m1', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_43', 's_005', 'b_java_m1', '2026-10-09', 'online', '08:06:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_44', 's_005', 'b_java_m1', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_45', 's_005', 'b_java_m1', '2026-10-14', 'online', '08:06:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_46', 's_006', 'b_java_m1', '2026-09-25', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_47', 's_006', 'b_java_m1', '2026-09-28', 'classroom', '08:07:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_48', 's_006', 'b_java_m1', '2026-09-30', 'classroom', '08:07:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_49', 's_006', 'b_java_m1', '2026-10-02', 'classroom', '08:07:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_50', 's_006', 'b_java_m1', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_51', 's_006', 'b_java_m1', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_52', 's_006', 'b_java_m1', '2026-10-09', 'classroom', '08:07:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_53', 's_006', 'b_java_m1', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_54', 's_006', 'b_java_m1', '2026-10-14', 'classroom', '08:07:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_55', 's_007', 'b_java_m1', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_56', 's_007', 'b_java_m1', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_57', 's_007', 'b_java_m1', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_58', 's_007', 'b_java_m1', '2026-10-02', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_59', 's_007', 'b_java_m1', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_60', 's_007', 'b_java_m1', '2026-10-07', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_61', 's_007', 'b_java_m1', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_62', 's_007', 'b_java_m1', '2026-10-12', 'online', '08:08:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_63', 's_007', 'b_java_m1', '2026-10-14', 'online', '20:07:40', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_64', 's_008', 'b_java_m1', '2026-09-25', 'classroom', '08:01:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_65', 's_008', 'b_java_m1', '2026-09-28', 'classroom', '08:01:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_66', 's_008', 'b_java_m1', '2026-09-30', 'classroom', '08:01:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_67', 's_008', 'b_java_m1', '2026-10-02', 'classroom', '08:01:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_68', 's_008', 'b_java_m1', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_69', 's_008', 'b_java_m1', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_70', 's_008', 'b_java_m1', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_71', 's_008', 'b_java_m1', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_72', 's_008', 'b_java_m1', '2026-10-14', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_73', 's_009', 'b_java_m1', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_74', 's_009', 'b_java_m1', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_75', 's_009', 'b_java_m1', '2026-09-30', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_76', 's_009', 'b_java_m1', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_77', 's_009', 'b_java_m1', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_78', 's_009', 'b_java_m1', '2026-10-07', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_79', 's_009', 'b_java_m1', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_80', 's_009', 'b_java_m1', '2026-10-12', 'online', '08:02:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_81', 's_009', 'b_java_m1', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_82', 's_010', 'b_java_m1', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_83', 's_010', 'b_java_m1', '2026-09-28', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_84', 's_010', 'b_java_m1', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_85', 's_010', 'b_java_m1', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_86', 's_010', 'b_java_m1', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_87', 's_010', 'b_java_m1', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_88', 's_010', 'b_java_m1', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_89', 's_010', 'b_java_m1', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_90', 's_010', 'b_java_m1', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_91', 's_011', 'b_java_fast', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_92', 's_011', 'b_java_fast', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_93', 's_011', 'b_java_fast', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_94', 's_011', 'b_java_fast', '2026-10-02', 'online', '08:04:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_95', 's_011', 'b_java_fast', '2026-10-05', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_96', 's_011', 'b_java_fast', '2026-10-07', 'online', '08:04:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_97', 's_011', 'b_java_fast', '2026-10-09', 'online', '08:04:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_98', 's_011', 'b_java_fast', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_99', 's_011', 'b_java_fast', '2026-10-14', 'online', '08:04:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_100', 's_012', 'b_java_fast', '2026-09-25', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_101', 's_012', 'b_java_fast', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_102', 's_012', 'b_java_fast', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_103', 's_012', 'b_java_fast', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_104', 's_012', 'b_java_fast', '2026-10-05', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_105', 's_012', 'b_java_fast', '2026-10-07', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_106', 's_012', 'b_java_fast', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_107', 's_012', 'b_java_fast', '2026-10-12', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_108', 's_012', 'b_java_fast', '2026-10-14', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_109', 's_013', 'b_java_fast', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_110', 's_013', 'b_java_fast', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_111', 's_013', 'b_java_fast', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_112', 's_013', 'b_java_fast', '2026-10-02', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_113', 's_013', 'b_java_fast', '2026-10-05', 'online', '08:06:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_114', 's_013', 'b_java_fast', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_115', 's_013', 'b_java_fast', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_116', 's_013', 'b_java_fast', '2026-10-12', 'online', '08:06:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_117', 's_013', 'b_java_fast', '2026-10-14', 'online', '08:06:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_118', 's_014', 'b_java_fast', '2026-09-25', 'classroom', '08:07:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_119', 's_014', 'b_java_fast', '2026-09-28', 'classroom', '08:07:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_120', 's_014', 'b_java_fast', '2026-09-30', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_121', 's_014', 'b_java_fast', '2026-10-02', 'classroom', '08:07:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_122', 's_014', 'b_java_fast', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_123', 's_014', 'b_java_fast', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_124', 's_014', 'b_java_fast', '2026-10-09', 'classroom', '08:07:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_125', 's_014', 'b_java_fast', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_126', 's_014', 'b_java_fast', '2026-10-14', 'classroom', '08:07:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_127', 's_015', 'b_java_fast', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_128', 's_015', 'b_java_fast', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_129', 's_015', 'b_java_fast', '2026-09-30', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_130', 's_015', 'b_java_fast', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_131', 's_015', 'b_java_fast', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_132', 's_015', 'b_java_fast', '2026-10-07', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_133', 's_015', 'b_java_fast', '2026-10-09', 'online', '08:08:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_134', 's_015', 'b_java_fast', '2026-10-12', 'online', '08:08:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_135', 's_015', 'b_java_fast', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_136', 's_016', 'b_java_fast', '2026-09-25', 'classroom', '08:01:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_137', 's_016', 'b_java_fast', '2026-09-28', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_138', 's_016', 'b_java_fast', '2026-09-30', 'classroom', '08:01:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_139', 's_016', 'b_java_fast', '2026-10-02', 'classroom', '08:01:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_140', 's_016', 'b_java_fast', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_141', 's_016', 'b_java_fast', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_142', 's_016', 'b_java_fast', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_143', 's_016', 'b_java_fast', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_144', 's_016', 'b_java_fast', '2026-10-14', 'classroom', '08:01:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_145', 's_017', 'b_java_fast', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_146', 's_017', 'b_java_fast', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_147', 's_017', 'b_java_fast', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_148', 's_017', 'b_java_fast', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_149', 's_017', 'b_java_fast', '2026-10-05', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_150', 's_017', 'b_java_fast', '2026-10-07', 'online', '08:02:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_151', 's_017', 'b_java_fast', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_152', 's_017', 'b_java_fast', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_153', 's_017', 'b_java_fast', '2026-10-14', 'online', '08:02:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_154', 's_018', 'b_java_e1', '2026-09-25', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_155', 's_018', 'b_java_e1', '2026-09-28', 'classroom', '08:03:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_156', 's_018', 'b_java_e1', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_157', 's_018', 'b_java_e1', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_158', 's_018', 'b_java_e1', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_159', 's_018', 'b_java_e1', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_160', 's_018', 'b_java_e1', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_161', 's_018', 'b_java_e1', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_162', 's_018', 'b_java_e1', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_163', 's_019', 'b_java_e1', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_164', 's_019', 'b_java_e1', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_165', 's_019', 'b_java_e1', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_166', 's_019', 'b_java_e1', '2026-10-02', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_167', 's_019', 'b_java_e1', '2026-10-05', 'online', '08:04:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_168', 's_019', 'b_java_e1', '2026-10-07', 'online', '08:04:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_169', 's_019', 'b_java_e1', '2026-10-09', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_170', 's_019', 'b_java_e1', '2026-10-12', 'online', '08:04:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_171', 's_019', 'b_java_e1', '2026-10-14', 'online', '08:04:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_172', 's_020', 'b_java_e1', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_173', 's_020', 'b_java_e1', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_174', 's_020', 'b_java_e1', '2026-09-30', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_175', 's_020', 'b_java_e1', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_176', 's_020', 'b_java_e1', '2026-10-05', 'classroom', '08:05:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_177', 's_020', 'b_java_e1', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_178', 's_020', 'b_java_e1', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_179', 's_020', 'b_java_e1', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_180', 's_020', 'b_java_e1', '2026-10-14', 'classroom', '08:05:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_181', 's_021', 'b_java_e1', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_182', 's_021', 'b_java_e1', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_183', 's_021', 'b_java_e1', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_184', 's_021', 'b_java_e1', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_185', 's_021', 'b_java_e1', '2026-10-05', 'online', '08:06:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_186', 's_021', 'b_java_e1', '2026-10-07', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_187', 's_021', 'b_java_e1', '2026-10-09', 'online', '08:06:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_188', 's_021', 'b_java_e1', '2026-10-12', 'online', '08:06:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_189', 's_021', 'b_java_e1', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_190', 's_022', 'b_java_e1', '2026-09-25', 'classroom', '08:07:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_191', 's_022', 'b_java_e1', '2026-09-28', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_192', 's_022', 'b_java_e1', '2026-09-30', 'classroom', '08:07:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_193', 's_022', 'b_java_e1', '2026-10-02', 'classroom', '08:07:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_194', 's_022', 'b_java_e1', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_195', 's_022', 'b_java_e1', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_196', 's_022', 'b_java_e1', '2026-10-09', 'classroom', '08:07:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_197', 's_022', 'b_java_e1', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_198', 's_022', 'b_java_e1', '2026-10-14', 'classroom', '08:07:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_199', 's_023', 'b_java_e1', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_200', 's_023', 'b_java_e1', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_201', 's_023', 'b_java_e1', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_202', 's_023', 'b_java_e1', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_203', 's_023', 'b_java_e1', '2026-10-05', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_204', 's_023', 'b_java_e1', '2026-10-07', 'online', '08:08:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_205', 's_023', 'b_java_e1', '2026-10-09', 'online', '08:08:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_206', 's_023', 'b_java_e1', '2026-10-12', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_207', 's_023', 'b_java_e1', '2026-10-14', 'online', '08:08:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_208', 's_024', 'b_java_e1', '2026-09-25', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_209', 's_024', 'b_java_e1', '2026-09-28', 'classroom', '08:01:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_210', 's_024', 'b_java_e1', '2026-09-30', 'classroom', '08:01:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_211', 's_024', 'b_java_e1', '2026-10-02', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_212', 's_024', 'b_java_e1', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_213', 's_024', 'b_java_e1', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_214', 's_024', 'b_java_e1', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_215', 's_024', 'b_java_e1', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_216', 's_024', 'b_java_e1', '2026-10-14', 'classroom', '08:01:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_217', 's_025', 'b_py_m2', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_218', 's_025', 'b_py_m2', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_219', 's_025', 'b_py_m2', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_220', 's_025', 'b_py_m2', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_221', 's_025', 'b_py_m2', '2026-10-05', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_222', 's_025', 'b_py_m2', '2026-10-07', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_223', 's_025', 'b_py_m2', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_224', 's_025', 'b_py_m2', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_225', 's_025', 'b_py_m2', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_226', 's_026', 'b_py_m2', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_227', 's_026', 'b_py_m2', '2026-09-28', 'classroom', '08:03:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_228', 's_026', 'b_py_m2', '2026-09-30', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_229', 's_026', 'b_py_m2', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_230', 's_026', 'b_py_m2', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_231', 's_026', 'b_py_m2', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_232', 's_026', 'b_py_m2', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_233', 's_026', 'b_py_m2', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_234', 's_026', 'b_py_m2', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_235', 's_027', 'b_py_m2', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_236', 's_027', 'b_py_m2', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_237', 's_027', 'b_py_m2', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_238', 's_027', 'b_py_m2', '2026-10-02', 'online', '08:04:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_239', 's_027', 'b_py_m2', '2026-10-05', 'online', '08:04:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_240', 's_027', 'b_py_m2', '2026-10-07', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_241', 's_027', 'b_py_m2', '2026-10-09', 'online', '08:04:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_242', 's_027', 'b_py_m2', '2026-10-12', 'online', '08:04:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_243', 's_027', 'b_py_m2', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_244', 's_028', 'b_py_m2', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_245', 's_028', 'b_py_m2', '2026-09-28', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_246', 's_028', 'b_py_m2', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_247', 's_028', 'b_py_m2', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_248', 's_028', 'b_py_m2', '2026-10-05', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_249', 's_028', 'b_py_m2', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_250', 's_028', 'b_py_m2', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_251', 's_028', 'b_py_m2', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_252', 's_028', 'b_py_m2', '2026-10-14', 'classroom', '08:05:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_253', 's_029', 'b_py_m2', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_254', 's_029', 'b_py_m2', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_255', 's_029', 'b_py_m2', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_256', 's_029', 'b_py_m2', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_257', 's_029', 'b_py_m2', '2026-10-05', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_258', 's_029', 'b_py_m2', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_259', 's_029', 'b_py_m2', '2026-10-09', 'online', '08:06:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_260', 's_029', 'b_py_m2', '2026-10-12', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_261', 's_029', 'b_py_m2', '2026-10-14', 'online', '08:06:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_262', 's_030', 'b_py_m2', '2026-09-25', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_263', 's_030', 'b_py_m2', '2026-09-28', 'classroom', '08:07:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_264', 's_030', 'b_py_m2', '2026-09-30', 'classroom', '08:07:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_265', 's_030', 'b_py_m2', '2026-10-02', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_266', 's_030', 'b_py_m2', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_267', 's_030', 'b_py_m2', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_268', 's_030', 'b_py_m2', '2026-10-09', 'classroom', '08:07:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_269', 's_030', 'b_py_m2', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_270', 's_030', 'b_py_m2', '2026-10-14', 'classroom', '08:07:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_271', 's_031', 'b_py_m2', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_272', 's_031', 'b_py_m2', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_273', 's_031', 'b_py_m2', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_274', 's_031', 'b_py_m2', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_275', 's_031', 'b_py_m2', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_276', 's_031', 'b_py_m2', '2026-10-07', 'online', '08:08:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_277', 's_031', 'b_py_m2', '2026-10-09', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_278', 's_031', 'b_py_m2', '2026-10-12', 'online', '08:08:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_279', 's_031', 'b_py_m2', '2026-10-14', 'online', '08:08:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_280', 's_032', 'b_py_m2', '2026-09-25', 'classroom', '08:01:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_281', 's_032', 'b_py_m2', '2026-09-28', 'classroom', '08:01:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_282', 's_032', 'b_py_m2', '2026-09-30', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_283', 's_032', 'b_py_m2', '2026-10-02', 'classroom', '08:01:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_284', 's_032', 'b_py_m2', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_285', 's_032', 'b_py_m2', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_286', 's_032', 'b_py_m2', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_287', 's_032', 'b_py_m2', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_288', 's_032', 'b_py_m2', '2026-10-14', 'classroom', '08:01:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_289', 's_033', 'b_mern_e2', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_290', 's_033', 'b_mern_e2', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_291', 's_033', 'b_mern_e2', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_292', 's_033', 'b_mern_e2', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_293', 's_033', 'b_mern_e2', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_294', 's_033', 'b_mern_e2', '2026-10-07', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_295', 's_033', 'b_mern_e2', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_296', 's_033', 'b_mern_e2', '2026-10-12', 'online', '08:02:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_297', 's_033', 'b_mern_e2', '2026-10-14', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_298', 's_034', 'b_mern_e2', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_299', 's_034', 'b_mern_e2', '2026-09-28', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_300', 's_034', 'b_mern_e2', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_301', 's_034', 'b_mern_e2', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_302', 's_034', 'b_mern_e2', '2026-10-05', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_303', 's_034', 'b_mern_e2', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_304', 's_034', 'b_mern_e2', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_305', 's_034', 'b_mern_e2', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_306', 's_034', 'b_mern_e2', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_307', 's_035', 'b_mern_e2', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_308', 's_035', 'b_mern_e2', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_309', 's_035', 'b_mern_e2', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_310', 's_035', 'b_mern_e2', '2026-10-02', 'online', '08:04:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_311', 's_035', 'b_mern_e2', '2026-10-05', 'online', '08:04:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_312', 's_035', 'b_mern_e2', '2026-10-07', 'online', '08:04:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_313', 's_035', 'b_mern_e2', '2026-10-09', 'online', '08:04:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_314', 's_035', 'b_mern_e2', '2026-10-12', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_315', 's_035', 'b_mern_e2', '2026-10-14', 'online', '08:04:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_316', 's_036', 'b_mern_e2', '2026-09-25', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_317', 's_036', 'b_mern_e2', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_318', 's_036', 'b_mern_e2', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_319', 's_036', 'b_mern_e2', '2026-10-02', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_320', 's_036', 'b_mern_e2', '2026-10-05', 'classroom', '08:05:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_321', 's_036', 'b_mern_e2', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_322', 's_036', 'b_mern_e2', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_323', 's_036', 'b_mern_e2', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_324', 's_036', 'b_mern_e2', '2026-10-14', 'classroom', '08:05:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_325', 's_037', 'b_mern_e2', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_326', 's_037', 'b_mern_e2', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_327', 's_037', 'b_mern_e2', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_328', 's_037', 'b_mern_e2', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_329', 's_037', 'b_mern_e2', '2026-10-05', 'online', '08:06:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_330', 's_037', 'b_mern_e2', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_331', 's_037', 'b_mern_e2', '2026-10-09', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_332', 's_037', 'b_mern_e2', '2026-10-12', 'online', '08:06:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_333', 's_037', 'b_mern_e2', '2026-10-14', 'online', '08:06:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_334', 's_038', 'b_mern_e2', '2026-09-25', 'classroom', '08:07:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_335', 's_038', 'b_mern_e2', '2026-09-28', 'classroom', '08:07:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_336', 's_038', 'b_mern_e2', '2026-09-30', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_337', 's_038', 'b_mern_e2', '2026-10-02', 'classroom', '08:07:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_338', 's_038', 'b_mern_e2', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_339', 's_038', 'b_mern_e2', '2026-10-07', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_340', 's_038', 'b_mern_e2', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_341', 's_038', 'b_mern_e2', '2026-10-12', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_342', 's_038', 'b_mern_e2', '2026-10-14', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_343', 's_039', 'b_mern_e2', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_344', 's_039', 'b_mern_e2', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_345', 's_039', 'b_mern_e2', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_346', 's_039', 'b_mern_e2', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_347', 's_039', 'b_mern_e2', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_348', 's_039', 'b_mern_e2', '2026-10-07', 'online', '08:08:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_349', 's_039', 'b_mern_e2', '2026-10-09', 'online', '08:08:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_350', 's_039', 'b_mern_e2', '2026-10-12', 'online', '08:08:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_351', 's_039', 'b_mern_e2', '2026-10-14', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_352', 's_040', 'b_mern_e2', '2026-09-25', 'classroom', '08:01:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_353', 's_040', 'b_mern_e2', '2026-09-28', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_354', 's_040', 'b_mern_e2', '2026-09-30', 'classroom', '08:01:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_355', 's_040', 'b_mern_e2', '2026-10-02', 'classroom', '08:01:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_356', 's_040', 'b_mern_e2', '2026-10-05', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_357', 's_040', 'b_mern_e2', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_358', 's_040', 'b_mern_e2', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_359', 's_040', 'b_mern_e2', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_360', 's_040', 'b_mern_e2', '2026-10-14', 'classroom', '08:01:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_361', 's_041', 'b_ai_w2', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_362', 's_041', 'b_ai_w2', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_363', 's_041', 'b_ai_w2', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_364', 's_041', 'b_ai_w2', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_365', 's_041', 'b_ai_w2', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_366', 's_041', 'b_ai_w2', '2026-10-07', 'online', '08:02:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_367', 's_041', 'b_ai_w2', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_368', 's_041', 'b_ai_w2', '2026-10-12', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_369', 's_041', 'b_ai_w2', '2026-10-14', 'online', '08:02:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_370', 's_042', 'b_ai_w2', '2026-09-25', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_371', 's_042', 'b_ai_w2', '2026-09-28', 'classroom', '08:03:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_372', 's_042', 'b_ai_w2', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_373', 's_042', 'b_ai_w2', '2026-10-02', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_374', 's_042', 'b_ai_w2', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_375', 's_042', 'b_ai_w2', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_376', 's_042', 'b_ai_w2', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_377', 's_042', 'b_ai_w2', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_378', 's_042', 'b_ai_w2', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_379', 's_043', 'b_ai_w2', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_380', 's_043', 'b_ai_w2', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_381', 's_043', 'b_ai_w2', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_382', 's_043', 'b_ai_w2', '2026-10-02', 'online', '08:04:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_383', 's_043', 'b_ai_w2', '2026-10-05', 'online', '08:04:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_384', 's_043', 'b_ai_w2', '2026-10-07', 'online', '08:04:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_385', 's_043', 'b_ai_w2', '2026-10-09', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_386', 's_043', 'b_ai_w2', '2026-10-12', 'online', '08:04:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_387', 's_043', 'b_ai_w2', '2026-10-14', 'online', '08:04:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_388', 's_044', 'b_ai_w2', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_389', 's_044', 'b_ai_w2', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_390', 's_044', 'b_ai_w2', '2026-09-30', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_391', 's_044', 'b_ai_w2', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_392', 's_044', 'b_ai_w2', '2026-10-05', 'classroom', '08:05:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_393', 's_044', 'b_ai_w2', '2026-10-07', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_394', 's_044', 'b_ai_w2', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_395', 's_044', 'b_ai_w2', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_396', 's_044', 'b_ai_w2', '2026-10-14', 'classroom', '08:05:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_397', 's_045', 'b_ai_w2', '2026-09-25', 'online', '08:06:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_398', 's_045', 'b_ai_w2', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_399', 's_045', 'b_ai_w2', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_400', 's_045', 'b_ai_w2', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_401', 's_045', 'b_ai_w2', '2026-10-05', 'online', '08:06:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_402', 's_045', 'b_ai_w2', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_403', 's_045', 'b_ai_w2', '2026-10-09', 'online', '08:06:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_404', 's_045', 'b_ai_w2', '2026-10-12', 'online', '08:06:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_405', 's_045', 'b_ai_w2', '2026-10-14', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_406', 's_046', 'b_ai_w2', '2026-09-25', 'classroom', '08:07:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_407', 's_046', 'b_ai_w2', '2026-09-28', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_408', 's_046', 'b_ai_w2', '2026-09-30', 'classroom', '08:07:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_409', 's_046', 'b_ai_w2', '2026-10-02', 'classroom', '08:07:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_410', 's_046', 'b_ai_w2', '2026-10-05', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_411', 's_046', 'b_ai_w2', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_412', 's_046', 'b_ai_w2', '2026-10-09', 'classroom', '08:07:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_413', 's_046', 'b_ai_w2', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_414', 's_046', 'b_ai_w2', '2026-10-14', 'classroom', '08:07:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_415', 's_047', 'b_ai_w2', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_416', 's_047', 'b_ai_w2', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_417', 's_047', 'b_ai_w2', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_418', 's_047', 'b_ai_w2', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_419', 's_047', 'b_ai_w2', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_420', 's_047', 'b_ai_w2', '2026-10-07', 'online', '08:08:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_421', 's_047', 'b_ai_w2', '2026-10-09', 'online', '08:08:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_422', 's_047', 'b_ai_w2', '2026-10-12', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_423', 's_047', 'b_ai_w2', '2026-10-14', 'online', '08:08:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_424', 's_048', 'b_ai_w2', '2026-09-25', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_425', 's_048', 'b_ai_w2', '2026-09-28', 'classroom', '08:01:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_426', 's_048', 'b_ai_w2', '2026-09-30', 'classroom', '08:01:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_427', 's_048', 'b_ai_w2', '2026-10-02', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_428', 's_048', 'b_ai_w2', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_429', 's_048', 'b_ai_w2', '2026-10-07', 'classroom', '08:01:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_430', 's_048', 'b_ai_w2', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_431', 's_048', 'b_ai_w2', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_432', 's_048', 'b_ai_w2', '2026-10-14', 'classroom', '08:01:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_433', 's_049', 'b_iot_m3', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_434', 's_049', 'b_iot_m3', '2026-09-28', 'online', '08:02:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_435', 's_049', 'b_iot_m3', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_436', 's_049', 'b_iot_m3', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_437', 's_049', 'b_iot_m3', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_438', 's_049', 'b_iot_m3', '2026-10-07', 'online', '08:02:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_439', 's_049', 'b_iot_m3', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_440', 's_049', 'b_iot_m3', '2026-10-12', 'online', '08:02:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_441', 's_049', 'b_iot_m3', '2026-10-14', 'online', '18:11:51', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_442', 's_050', 'b_iot_m3', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_443', 's_050', 'b_iot_m3', '2026-09-28', 'classroom', '08:03:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_444', 's_050', 'b_iot_m3', '2026-09-30', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_445', 's_050', 'b_iot_m3', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_446', 's_050', 'b_iot_m3', '2026-10-05', 'classroom', '08:03:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_447', 's_050', 'b_iot_m3', '2026-10-07', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_448', 's_050', 'b_iot_m3', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_449', 's_050', 'b_iot_m3', '2026-10-12', 'classroom', '08:03:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_450', 's_050', 'b_iot_m3', '2026-10-14', 'classroom', '18:11:52', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_451', 's_051', 'b_iot_m3', '2026-09-25', 'online', '08:04:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_452', 's_051', 'b_iot_m3', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_453', 's_051', 'b_iot_m3', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_454', 's_051', 'b_iot_m3', '2026-10-02', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_455', 's_051', 'b_iot_m3', '2026-10-05', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_456', 's_051', 'b_iot_m3', '2026-10-07', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_457', 's_051', 'b_iot_m3', '2026-10-09', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_458', 's_051', 'b_iot_m3', '2026-10-12', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_459', 's_051', 'b_iot_m3', '2026-10-14', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_460', 's_052', 'b_iot_m3', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_461', 's_052', 'b_iot_m3', '2026-09-28', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_462', 's_052', 'b_iot_m3', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_463', 's_052', 'b_iot_m3', '2026-10-02', 'classroom', '08:05:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_464', 's_052', 'b_iot_m3', '2026-10-05', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_465', 's_052', 'b_iot_m3', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_466', 's_052', 'b_iot_m3', '2026-10-09', 'classroom', '08:05:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_467', 's_052', 'b_iot_m3', '2026-10-12', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_468', 's_052', 'b_iot_m3', '2026-10-14', 'classroom', '18:11:53', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_469', 's_053', 'b_iot_m3', '2026-09-25', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_470', 's_053', 'b_iot_m3', '2026-09-28', 'online', '08:06:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_471', 's_053', 'b_iot_m3', '2026-09-30', 'online', '08:06:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_472', 's_053', 'b_iot_m3', '2026-10-02', 'online', '08:06:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_473', 's_053', 'b_iot_m3', '2026-10-05', 'online', '08:06:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_474', 's_053', 'b_iot_m3', '2026-10-07', 'online', '08:06:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_475', 's_053', 'b_iot_m3', '2026-10-09', 'online', '08:06:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_476', 's_053', 'b_iot_m3', '2026-10-12', 'online', '08:06:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_477', 's_053', 'b_iot_m3', '2026-10-14', 'online', '18:11:54', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_478', 's_054', 'b_iot_m3', '2026-09-25', 'classroom', '08:07:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_479', 's_054', 'b_iot_m3', '2026-09-28', 'classroom', '08:07:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_480', 's_054', 'b_iot_m3', '2026-09-30', 'classroom', '08:07:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_481', 's_054', 'b_iot_m3', '2026-10-02', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_482', 's_054', 'b_iot_m3', '2026-10-05', 'classroom', '08:07:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_483', 's_054', 'b_iot_m3', '2026-10-07', 'classroom', '08:07:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_484', 's_054', 'b_iot_m3', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_485', 's_054', 'b_iot_m3', '2026-10-12', 'classroom', '08:07:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_486', 's_054', 'b_iot_m3', '2026-10-14', 'classroom', '18:11:55', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_487', 's_055', 'b_dbms_w1', '2026-09-25', 'online', '08:08:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_488', 's_055', 'b_dbms_w1', '2026-09-28', 'online', '08:08:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_489', 's_055', 'b_dbms_w1', '2026-09-30', 'online', '08:08:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_490', 's_055', 'b_dbms_w1', '2026-10-02', 'online', '08:08:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_491', 's_055', 'b_dbms_w1', '2026-10-05', 'online', '08:08:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_492', 's_055', 'b_dbms_w1', '2026-10-07', 'online', '08:08:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_493', 's_055', 'b_dbms_w1', '2026-10-09', 'online', '08:08:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_494', 's_055', 'b_dbms_w1', '2026-10-12', 'online', '08:08:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_495', 's_055', 'b_dbms_w1', '2026-10-14', 'online', '08:08:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_496', 's_056', 'b_dbms_w1', '2026-09-25', 'classroom', '08:01:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_497', 's_056', 'b_dbms_w1', '2026-09-28', 'classroom', '08:01:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_498', 's_056', 'b_dbms_w1', '2026-09-30', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_499', 's_056', 'b_dbms_w1', '2026-10-02', 'classroom', '08:01:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_500', 's_056', 'b_dbms_w1', '2026-10-05', 'classroom', '08:01:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."attendance" ("id", "student_id", "batch_id", "date", "mode", "check_in_time", "status", "ip_or_location", "created_at")
VALUES
  ('att_501', 's_056', 'b_dbms_w1', '2026-10-07', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_502', 's_056', 'b_dbms_w1', '2026-10-09', 'classroom', '08:01:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_503', 's_056', 'b_dbms_w1', '2026-10-12', 'classroom', '08:01:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_504', 's_056', 'b_dbms_w1', '2026-10-14', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_505', 's_057', 'b_dbms_w1', '2026-09-25', 'online', '08:02:10', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_506', 's_057', 'b_dbms_w1', '2026-09-28', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_507', 's_057', 'b_dbms_w1', '2026-09-30', 'online', '08:02:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_508', 's_057', 'b_dbms_w1', '2026-10-02', 'online', '08:02:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_509', 's_057', 'b_dbms_w1', '2026-10-05', 'online', '08:02:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_510', 's_057', 'b_dbms_w1', '2026-10-07', 'online', '08:02:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_511', 's_057', 'b_dbms_w1', '2026-10-09', 'online', '08:02:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_512', 's_057', 'b_dbms_w1', '2026-10-12', 'online', '08:02:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_513', 's_057', 'b_dbms_w1', '2026-10-14', 'online', '08:18:45', 'late', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_514', 's_058', 'b_dbms_w1', '2026-09-25', 'classroom', '08:03:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_515', 's_058', 'b_dbms_w1', '2026-09-28', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_516', 's_058', 'b_dbms_w1', '2026-09-30', 'classroom', '08:03:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_517', 's_058', 'b_dbms_w1', '2026-10-02', 'classroom', '08:03:13', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_518', 's_058', 'b_dbms_w1', '2026-10-05', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_519', 's_058', 'b_dbms_w1', '2026-10-07', 'classroom', '08:03:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_520', 's_058', 'b_dbms_w1', '2026-10-09', 'classroom', '08:03:16', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_521', 's_058', 'b_dbms_w1', '2026-10-12', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_522', 's_058', 'b_dbms_w1', '2026-10-14', 'classroom', '08:03:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_523', 's_059', 'b_dbms_w1', '2026-09-25', 'online', NULL, 'absent', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_524', 's_059', 'b_dbms_w1', '2026-09-28', 'online', '08:04:11', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_525', 's_059', 'b_dbms_w1', '2026-09-30', 'online', '08:04:12', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_526', 's_059', 'b_dbms_w1', '2026-10-02', 'online', '08:04:13', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_527', 's_059', 'b_dbms_w1', '2026-10-05', 'online', '08:04:14', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_528', 's_059', 'b_dbms_w1', '2026-10-07', 'online', '08:04:15', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_529', 's_059', 'b_dbms_w1', '2026-10-09', 'online', '08:04:16', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_530', 's_059', 'b_dbms_w1', '2026-10-12', 'online', '08:04:17', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_531', 's_059', 'b_dbms_w1', '2026-10-14', 'online', '08:04:18', 'present', 'Zoom WebSDK (IP: 49.36.12.8)', '2026-10-16 12:11:02'),
  ('att_532', 's_060', 'b_dbms_w1', '2026-09-25', 'classroom', '08:05:10', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_533', 's_060', 'b_dbms_w1', '2026-09-28', 'classroom', '08:05:11', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_534', 's_060', 'b_dbms_w1', '2026-09-30', 'classroom', '08:05:12', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_535', 's_060', 'b_dbms_w1', '2026-10-02', 'classroom', '08:18:45', 'late', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_536', 's_060', 'b_dbms_w1', '2026-10-05', 'classroom', '08:05:14', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_537', 's_060', 'b_dbms_w1', '2026-10-07', 'classroom', '08:05:15', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_538', 's_060', 'b_dbms_w1', '2026-10-09', 'classroom', NULL, 'absent', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_539', 's_060', 'b_dbms_w1', '2026-10-12', 'classroom', '08:05:17', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02'),
  ('att_540', 's_060', 'b_dbms_w1', '2026-10-14', 'classroom', '08:05:18', 'present', 'Room Biometric Console 01', '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

-- Table: assignments (5 rows)
INSERT INTO public."assignments" ("id", "batch_id", "title", "description", "due_date", "max_marks", "created_at")
VALUES
  ('asg_java_1', 'b_java_m1', 'Spring Boot REST API with JWT Auth', 'Build authenticated endpoints with refresh tokens and PostgreSQL repo.', '2026-10-05', 100, '2026-10-16 12:11:02'),
  ('asg_java_2', 'b_java_m1', 'Microservices & Kafka Event Bus', 'Implement order and inventory pub/sub events with retry topics.', '2026-10-18', 100, '2026-10-16 12:11:02'),
  ('asg_py_1', 'b_py_m2', 'ETL Pipeline with Airflow & DuckDB', 'Automate ingestion of 1M rows with data validation checks.', '2026-10-08', 100, '2026-10-16 12:11:02'),
  ('asg_mern_1', 'b_mern_e2', 'Realtime Chat with Socket.IO', 'Multi-room chat with typing indicators and read receipts.', '2026-10-10', 100, '2026-10-16 12:11:02'),
  ('asg_ai_1', 'b_ai_w2', 'RAG Pipeline with LangChain & FAISS', 'Build document QA system with chunking and reranking.', '2026-10-12', 100, '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

-- Table: submissions (9 rows)
INSERT INTO public."submissions" ("id", "assignment_id", "student_id", "submitted_at", "status", "marks", "feedback", "submission_url")
VALUES
  ('sub_1_1', 'asg_java_1', 's_001', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_001/java-rest'),
  ('sub_2_1', 'asg_java_1', 's_002', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_002/java-rest'),
  ('sub_4_1', 'asg_java_1', 's_004', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_004/java-rest'),
  ('sub_5_1', 'asg_java_1', 's_005', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_005/java-rest'),
  ('sub_6_1', 'asg_java_1', 's_006', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_006/java-rest'),
  ('sub_7_1', 'asg_java_1', 's_007', '2026-10-04 19:30:00', 'graded', 68, 'Good effort, improve error handling', 'https://github.com/instipilot-students/s_007/java-rest'),
  ('sub_8_1', 'asg_java_1', 's_008', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_008/java-rest'),
  ('sub_9_1', 'asg_java_1', 's_009', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_009/java-rest'),
  ('sub_10_1', 'asg_java_1', 's_010', '2026-10-04 19:30:00', 'graded', 88, 'Excellent clean code and documentation', 'https://github.com/instipilot-students/s_010/java-rest')
ON CONFLICT (id) DO NOTHING;

-- Table: recordings (6 rows)
INSERT INTO public."recordings" ("id", "batch_id", "title", "url", "date", "duration_minutes", "topic_tags", "views_count", "created_at")
VALUES
  ('rec_1', 'b_java_m1', 'L12: Spring Security 6 & OAuth2 Filter Chain', 'https://cdn.instipilot.com/recordings/java-m1-lec12.mp4', '2026-10-14', 115, 'spring-security, oauth2, filters', 24, '2026-10-16 12:11:02'),
  ('rec_2', 'b_java_m1', 'L11: Hibernate Caching & N+1 Problem Solver', 'https://cdn.instipilot.com/recordings/java-m1-lec11.mp4', '2026-10-12', 120, 'hibernate, orm, performance', 31, '2026-10-16 12:11:02'),
  ('rec_3', 'b_java_m1', 'L10: Dockerizing Multi-module Spring App', 'https://cdn.instipilot.com/recordings/java-m1-lec10.mp4', '2026-10-09', 110, 'docker, devops, spring', 28, '2026-10-16 12:11:02'),
  ('rec_4', 'b_py_m2', 'L08: Pandas Vectorization vs Cython Optimizations', 'https://cdn.instipilot.com/recordings/py-m2-lec08.mp4', '2026-10-13', 105, 'pandas, performance, python', 19, '2026-10-16 12:11:02'),
  ('rec_5', 'b_mern_e2', 'L09: Server Actions & Next.js 14 App Router State', 'https://cdn.instipilot.com/recordings/mern-e2-lec09.mp4', '2026-10-13', 118, 'nextjs, react, server-actions', 22, '2026-10-16 12:11:02'),
  ('rec_6', 'b_ai_w2', 'L06: Fine-tuning Llama-3 with LoRA and Unsloth', 'https://cdn.instipilot.com/recordings/ai-w2-lec06.mp4', '2026-10-11', 230, 'genai, lora, finetuning', 45, '2026-10-16 12:11:02')
ON CONFLICT (id) DO NOTHING;

-- Table: timetable_slots (38 rows)
INSERT INTO public."timetable_slots" ("id", "batch_id", "trainer_id", "room_id", "day_of_week", "start_time", "end_time", "is_active", "notes", "created_at")
VALUES
  ('slot_1', 'b_java_m1', 't_rahul', 'room_1', 'Mon', '08:00', '10:00', TRUE, 'Replanned: t_vikram unavailable Mon 08:00-10:00. Assigned to Rahul Kulkarni.', '2026-10-16 12:11:02'),
  ('slot_2', 'b_java_m1', 't_vikram', 'room_1', 'Wed', '08:00', '10:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_3', 'b_java_m1', 't_vikram', 'room_1', 'Fri', '08:00', '10:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_4', 'b_java_fast', 't_sunita', 'room_4', 'Mon', '10:15', '12:15', TRUE, 'Replanned: t_vikram unavailable Mon 08:00-11:00. Assigned to Sunita Deshmukh.', '2026-10-16 12:11:02'),
  ('slot_5', 'b_java_fast', 't_vikram', 'room_4', 'Wed', '10:15', '12:15', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_6', 'b_java_fast', 't_vikram', 'room_4', 'Fri', '10:15', '12:15', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_7', 'b_java_e1', 't_vikram', 'room_4', 'Mon', '18:00', '20:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_8', 'b_java_e1', 't_vikram', 'room_4', 'Wed', '18:00', '20:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_9', 'b_java_e1', 't_vikram', 'room_4', 'Fri', '18:00', '20:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_10', 'b_py_m2', 't_sunita', 'room_2', 'Tue', '09:00', '11:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_11', 'b_py_m2', 't_sunita', 'room_2', 'Thu', '09:00', '11:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_12', 'b_py_m2', 't_sunita', 'room_2', 'Sat', '09:00', '11:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_13', 'b_mern_e2', 't_arjun', 'room_1', 'Mon', '16:30', '18:30', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_14', 'b_mern_e2', 't_arjun', 'room_1', 'Tue', '16:30', '18:30', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_15', 'b_mern_e2', 't_arjun', 'room_1', 'Thu', '16:30', '18:30', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_16', 'b_ai_w2', 't_pooja', 'room_3', 'Sat', '14:00', '18:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_17', 'b_ai_w2', 't_pooja', 'room_3', 'Sun', '14:00', '18:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_18', 'b_iot_m3', 't_rahul', 'room_5', 'Tue', '08:00', '11:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_19', 'b_iot_m3', 't_rahul', 'room_5', 'Thu', '08:00', '11:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_20', 'b_dbms_w1', 't_aniket', NULL, 'Sat', '10:00', '13:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_21', 'b_dbms_w1', 't_aniket', NULL, 'Sun', '10:00', '13:00', TRUE, 'Regular Schedule', '2026-10-16 12:11:02'),
  ('slot_1792157733121_Mon', 'b_1792157733120', 't_vikram', 'room_1', 'Mon', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:33'),
  ('slot_1792157733121_Wed', 'b_1792157733120', 't_vikram', 'room_1', 'Wed', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:33'),
  ('slot_1792157733121_Fri', 'b_1792157733120', 't_vikram', 'room_1', 'Fri', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:33'),
  ('slot_1792157749455_Mon', 'b_1792157749454', 't_vikram', 'room_1', 'Mon', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:49'),
  ('slot_1792157749455_Wed', 'b_1792157749454', 't_vikram', 'room_1', 'Wed', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:49'),
  ('slot_1792157749455_Fri', 'b_1792157749454', 't_vikram', 'room_1', 'Fri', '16:00', '19:00', TRUE, 'Regular Schedule', '2026-10-16 13:35:49'),
  ('slot_1792158144402_Sat', 'b_1792158144402', 't_vikram', 'room_1', 'Sat', '09:00', '12:00', TRUE, 'Regular Schedule', '2026-10-16 13:42:24'),
  ('slot_1792158144402_Sun', 'b_1792158144402', 't_vikram', 'room_1', 'Sun', '09:00', '12:00', TRUE, 'Regular Schedule', '2026-10-16 13:42:24'),
  ('slot_1792158200748_Sat', 'b_1792158200748', 't_vikram', 'room_1', 'Sat', '09:00', '12:00', TRUE, 'Regular Schedule', '2026-10-16 13:43:20'),
  ('slot_1792158200748_Sun', 'b_1792158200748', 't_vikram', 'room_1', 'Sun', '09:00', '12:00', TRUE, 'Regular Schedule', '2026-10-16 13:43:20'),
  ('slot_1792158734744_Mon', 'b_1792158734744', 't_vikram', 'room_1', 'Mon', '14:00', '16:00', TRUE, 'Regular Schedule', '2026-10-16 13:52:14'),
  ('slot_1792158734745_Wed', 'b_1792158734744', 't_vikram', 'room_1', 'Wed', '14:00', '16:00', TRUE, 'Regular Schedule', '2026-10-16 13:52:14'),
  ('slot_1792158734745_Fri', 'b_1792158734744', 't_vikram', 'room_1', 'Fri', '14:00', '16:00', TRUE, 'Regular Schedule', '2026-10-16 13:52:14'),
  ('slot_1792161038465_Tue', 'b_1792161038465', 't_vikram', 'room_1', 'Tue', '18:00', '20:00', TRUE, 'Regular Schedule', '2026-10-16 14:30:38'),
  ('slot_1792161038465_Thu', 'b_1792161038465', 't_vikram', 'room_1', 'Thu', '18:00', '20:00', TRUE, 'Regular Schedule', '2026-10-16 14:30:38'),
  ('slot_1792162002037_Sat', 'b_1792162002036', 't_sunita', 'room_2', 'Sat', '10:00', '13:00', TRUE, 'Regular Schedule', '2026-10-16 14:46:42'),
  ('slot_1792162002037_Sun', 'b_1792162002036', 't_sunita', 'room_2', 'Sun', '10:00', '13:00', TRUE, 'Regular Schedule', '2026-10-16 14:46:42')
ON CONFLICT (id) DO NOTHING;

-- Table: messages_outbox (4 rows)
INSERT INTO public."messages_outbox" ("id", "student_id", "recipient_phone", "recipient_name", "channel", "template_name", "message_text", "draft_reason", "status", "created_by_role", "approved_by", "approved_at", "sent_at", "created_at")
VALUES
  ('msg_001', 's_003', '+91 9820033333', 'Rohan Gupta', 'whatsapp', 'attendance_and_fee_alert', 'Hi Rohan, we noticed you missed 4 classes this month in the Java Fullstack batch. Also, your course EMI of ₹11,250 is due on 19th Oct. Please connect with your mentor Vikram sir or reply to this message for assistance.', 'AI Copilot high-risk alert triggered by 4 missed classes & pending EMI due this week', 'approved', 'counselor', 'Priya Sharma', '2026-10-16 12:25:57', NULL, '2026-10-16 12:11:02'),
  ('msg_002', 's_012', '+91 9820044444', 'Amit Patel', 'whatsapp', 'overdue_emi_warning', 'Dear Amit, two consecutive fee installments (total ₹19,000) for your Python Data Engineering course remain overdue. Please settle or speak to the accounts office today to maintain your lab access.', 'Accounts flag: 2 consecutive missed EMIs', 'draft', 'accounts', NULL, NULL, NULL, '2026-10-16 12:11:02'),
  ('msg_ai_1792153425542_b4138', 's_007', '+91 9820077777', 'Ananya Deshmukh', 'whatsapp', NULL, 'Hi Ananya 👋, InstiPilot Academy here.

You''ve missed 3 recent Java Fullstack sessions. Lecture recordings are available on the portal — do check them out!

Reminder: Your installment of ₹11,667 is due tomorrow (Oct 18). Please clear via UPI/Bank transfer.

Reach out if you need academic support! 🚀', '3 missed classes in Java batch + EMI due Oct 18', 'draft', 'owner', NULL, NULL, NULL, '2026-10-16 12:23:45'),
  ('msg_ai_1792160252963_xqmzg', 's_003', '+91 9820033333', 'Rohan Gupta', 'whatsapp', NULL, 'Hi Rohan 👋, InstiPilot Academic Office here.

We wanted to check in on you. You''ve missed 5 classes in your Java Fullstack Morning (Alpha) batch.

Trainer Vikram Malhotra has lecture recordings available for you to catch up. Please reach out if you need any academic support! 🚀', '5 missed classes', 'draft', 'owner', NULL, NULL, NULL, '2026-10-16 14:17:32')
ON CONFLICT (id) DO NOTHING;

-- Table: audit_log (79 rows)
INSERT INTO public."audit_log" ("id", "user_id", "user_name", "role", "action", "query", "result_summary", "status", "ip_address", "timestamp")
VALUES
  ('aud_001', 'u_owner', 'Priya Sharma', 'owner', 'system_init', 'System initialization and database seed', 'Seeded 60 students, 6 courses, 8 batches, 6 trainers, 5 rooms, 17 tables', 'success', NULL, '2026-10-16 12:11:02'),
  ('aud_blk_1792152677648_vwneyk', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 12:11:17'),
  ('aud_ok_1792153425541_8t4l09', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Which students missed 3 classes in Java and have pending EMI? [SQL: SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) as missed_classes,
  e.due_date as emi_due_date, e.amount as emi_amount
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
JOIN emi_installments e ON e.student_id = s.id AND e.status = ''pending''
WHERE b.id = ''b_java_m1''
GROUP BY s.id
HAVING missed_classes >= 3
ORDER BY missed_classes DESC LIMIT 50]', 'Returned 2 rows in 8ms', 'success', NULL, '2026-10-16 12:23:45'),
  ('aud_blk_1792153458382', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'How much fee is pending across all batches?', '🛡️ **RBAC Policy Block — Trainer Role**

As a Trainer, your session is strictly limited to pedagogical data (batches, attendance, assignments, recordings). Financial tables (fee_plans, emi_installments, payments) are never included in the Copilot prompt context for your role.

This block was intentional per InstiPilot Zero-Trust RBAC design. The SQL validator would also reject any attempt to query these tables directly.', 'blocked', NULL, '2026-10-16 12:24:18'),
  ('aud_approve_1792153557566', 'u_owner', 'Priya Sharma', 'owner', 'action_approved', 'Approved WhatsApp message to Student (N/A)', 'Message: Outbox message approved...', 'success', NULL, '2026-10-16 12:25:57'),
  ('aud_blk_1792153574522_0ygo99', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 12:26:14'),
  ('aud_blk_1792153943862_o1kb', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 12:32:23'),
  ('aud_batch_1792158200748', 'u_owner', 'Priya Sharma', 'owner', 'create_batch', 'Created batch Java Weekend Express Test (09:00-12:00, Sat,Sun)', 'Clash detected on Sat with batch "Java Weekend Express Test". Automatic timetable replanning advised.', 'warning', NULL, '2026-10-16 13:43:20'),
  ('aud_blk_1792158530447_l33ls', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 13:48:50'),
  ('aud_user_1792158552283', 'u_owner', 'Priya Sharma', 'owner', 'create_user', 'Created TRAINER account: Prof. Ritu Verma (ritu.trainer@instipilot.com)', 'User ID: u_trainer_1792158552283, Trainer Profile: t_1792158552283', 'success', NULL, '2026-10-16 13:49:12'),
  ('aud_blk_1792158679524_ogrja', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 13:51:19'),
  ('aud_batch_1792158734745', 'u_owner', 'Priya Sharma (Director)', 'owner', 'create_batch', 'Created batch Java Evening Cohort Pro 2 (14:00-16:00, Mon,Wed,Fri)', 'Batch created cleanly with default slots', 'success', NULL, '2026-10-16 13:52:14'),
  ('aud_ok_1792158837164_yotj5p', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'give me the details of  Aarav Gupta [SQL: SELECT s.name, s.phone, s.status, s.join_date, b.name as batch_name
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
WHERE s.status = ''active''
ORDER BY s.join_date DESC
LIMIT 10]', 'Returned 10 rows in 1ms', 'success', NULL, '2026-10-16 13:53:57'),
  ('aud_ok_1792159150314_as8jp', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav Gupta [SQL: SELECT s.name, s.phone, s.status, s.join_date, b.name as batch_name
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
WHERE s.status = ''active''
ORDER BY s.join_date DESC
LIMIT 10]', 'Returned 10 rows in 1ms', 'success', NULL, '2026-10-16 13:59:10'),
  ('aud_ok_1792160244260_6tlcy', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:17:24'),
  ('aud_ok_1792160252963_uxuw6s', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Tell me about Rohan Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:17:32'),
  ('aud_ok_1792160261408_rziu8b', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_query', 'Tell me about student Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:17:41'),
  ('aud_blk_1792160374355_2rcfnhg', 'u_trainer', 'Vikram Malhotra', 'trainer', 'copilot_blocked', 'Show me all student payments [SQL: SELECT * FROM payments]', 'Role ''trainer'' does not have permission to query table ''payments''. Access strictly blocked.', 'blocked', NULL, '2026-10-16 14:19:34'),
  ('aud_ok_1792160381562_quz6br', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:19:41'),
  ('aud_ok_1792160381596_hzievm', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Ananya Deshmukh [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_002'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-16 14:19:41'),
  ('aud_ok_1792160381618_infilo', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Rohan Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:19:41'),
  ('aud_ok_1792160381637_nv7km8', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Sneha Nair [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_004'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:19:41'),
  ('aud_ok_1792160381650_vledtn', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Amit Patel [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_012'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:19:41'),
  ('aud_ok_1792160390472_zmboc', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:19:50'),
  ('aud_ok_1792160390485_jjr9nb', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Rohan [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:19:50'),
  ('aud_ok_1792160390496_cjtu3', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Sneha [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_004'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:19:50'),
  ('aud_ok_1792160390508_8e543', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Tell me about Amit [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_012'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:19:50'),
  ('aud_ok_1792160967301_9tpjra', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'give me details of Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:29:27'),
  ('aud_ok_1792160982138_qax0hb', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:29:42'),
  ('aud_batch_1792161038465', 'u_owner', 'Priya Sharma', 'owner', 'create_batch', 'Created batch Test Evening Batch (18:00-20:00, Tue,Thu)', 'Clash detected on Tue with batch "Modern MERN & Cloud Cohort 7". Automatic timetable replanning advised.', 'warning', NULL, '2026-10-16 14:30:38'),
  ('aud_user_1792161044611', 'u_owner', 'Priya Sharma', 'owner', 'create_user', 'Created OWNER account: Dr. Rajesh Sharma (rajesh.sharma@instipilot.com)', 'User ID: u_owner_1792161044611', 'success', NULL, '2026-10-16 14:30:44'),
  ('aud_ok_1792161323470_usz1wk', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Rohan [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-16 14:35:23'),
  ('aud_ok_1792161358229_q2z3ib6', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Rohan [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:35:58'),
  ('aud_ok_1792161368429_usv319', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'show me student s_012 [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_012'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-16 14:36:08'),
  ('aud_ok_1792161376935_9mgc4d', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Gupta [SQL: SELECT s.id, s.name, s.phone, s.email, b.name as batch_name
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
WHERE s.id IN (''s_001'',''s_003'',''s_031'')
LIMIT 10]', 'Returned 3 rows in 0ms', 'success', NULL, '2026-10-16 14:36:16'),
  ('aud_ok_1792161509670_y355jr', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:38:29'),
  ('aud_batch_1792162002037', 'u_owner', 'Priya Sharma', 'owner', 'create_batch', 'Created batch Cloud Data Eng Weekend Cohort (10:00-13:00, Sat,Sun)', 'Clash detected on Sat with batch "Python Data Engineering Cohort 4". Automatic timetable replanning advised.', 'warning', NULL, '2026-10-16 14:46:42'),
  ('aud_user_1792162015276', 'u_owner', 'Priya Sharma', 'owner', 'create_user', 'Created OWNER account: Prof. Meenakshi Sundaram (meenakshi@instipilot.com)', 'User ID: u_owner_1792162015276', 'success', NULL, '2026-10-16 14:46:55'),
  ('aud_ok_1792162150374_ak4tlp', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'give details of Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 14:49:10'),
  ('aud_enr_1792192417501', 'u_owner', 'Priya Sharma', 'owner', 'student_enrolled', 'Enrolled student Yash Vardhan into batch b_java_m1', 'Student ID: s_1792192417497', 'success', NULL, '2026-10-16 23:13:37'),
  ('aud_upd_1792192426489', 'u_owner', 'Priya Sharma', 'owner', 'update_student', 'Updated student s_1792192417497 (Yash Vardhan)', 'Guardian: "Mrs. Sunita Suresh Vardhan" (Phone: +91 9820777999)', 'success', NULL, '2026-10-16 23:13:46'),
  ('aud_enr_1792192583926', 'u_owner', 'Priya Sharma', 'owner', 'student_enrolled', 'Enrolled student Pooja Hegde into batch b_mern_e2', 'Student ID: s_1792192583926', 'success', NULL, '2026-10-16 23:16:23'),
  ('aud_upd_1792192591522', 'u_owner', 'Priya Sharma', 'owner', 'update_student', 'Updated student s_1792192583926 (Pooja Hegde)', 'Guardian: "Mrs. Shailaja Manjunath Hegde" (Phone: +91 9820111333)', 'success', NULL, '2026-10-16 23:16:31'),
  ('aud_ok_1792192598085_j2om9c', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Pooja Hegde [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792192583926'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-16 23:16:38'),
  ('aud_upd_1792192684249', 'u_owner', 'Priya Sharma', 'owner', 'update_student', 'Updated student s_001 (Aarav Gupta)', 'Guardian: "Dr. Rameshwar Gupta" (Phone: +91 9730011999)', 'success', NULL, '2026-10-16 23:18:04'),
  ('aud_ok_1792192690700_mh1px', 'u_owner', 'Priya Sharma', 'owner', 'copilot_query', 'Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-16 23:18:10'),
  ('aud_enr_1792192782769', 'u_owner', 'Priya Sharma (Director)', 'owner', 'student_enrolled', 'Enrolled student krushna waghmare into batch b_iot_m3', 'Student ID: s_1792192782768', 'success', NULL, '2026-10-16 23:19:42'),
  ('aud_ok_1792192799026_1kpbiu', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Krushna waghamera [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792192782768'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-16 23:19:59'),
  ('aud_replan_1792192941491', 'system', 'Scheduler', 'owner', 'timetable_replan', 'Trainer t_vikram marked unavailable on Mon 08:00-10:00', 'Replanned 1 slot(s)', 'success', NULL, '2026-10-16 23:22:21'),
  ('aud_replan_1792192959266', 'system', 'Scheduler', 'owner', 'timetable_replan', 'Trainer t_vikram marked unavailable on Mon 08:00-11:00', 'Replanned 1 slot(s)', 'success', NULL, '2026-10-16 23:22:39')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."audit_log" ("id", "user_id", "user_name", "role", "action", "query", "result_summary", "status", "ip_address", "timestamp")
VALUES
  ('aud_enr_1792193048533', 'u_owner', 'Priya Sharma (Director)', 'owner', 'student_enrolled', 'Enrolled student sudhanshu tekale  into batch b_dbms_w1', 'Student ID: s_1792193048533', 'success', NULL, '2026-10-16 23:24:08'),
  ('aud_blk_1792205521258_j5bbdp', 'u_student', 'Aarav Gupta', 'student', 'copilot_blocked', 'what is my attendance and fee status [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'']', 'Role ''student'' does not have permission to query table ''enrollments''. Access strictly blocked.', 'blocked', NULL, '2026-10-17 02:52:01'),
  ('aud_ok_1792205541539_e5707fm', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'what is my attendance and fee status [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 02:52:21'),
  ('aud_ok_1792206951230_elkxcs', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Krushna [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792192782768'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 03:15:51'),
  ('aud_ok_1792209728499_2jis98', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'krushna [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792192782768'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 04:02:08'),
  ('aud_enr_1792210727743', 'u_owner', 'Priya Sharma (Director)', 'owner', 'student_enrolled', 'Enrolled student sakshi into batch b_py_m2', 'Student ID: s_1792210727742', 'success', NULL, '2026-10-17 04:18:47'),
  ('aud_ok_1792210932975_k3q4re', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Sakshi [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792210727742'' LIMIT 50]', 'Returned 1 rows in 4ms', 'success', NULL, '2026-10-17 04:22:12'),
  ('aud_ok_1792210977597_c35uoh', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Krushna [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792192782768'' LIMIT 50]', 'Returned 1 rows in 0ms', 'success', NULL, '2026-10-17 04:22:57'),
  ('aud_ok_1792211003866_jq4yvf', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Rohan Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_003'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 04:23:23'),
  ('aud_ok_1792211125652_aprsm8', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Who are the top 5 students most at risk of dropping out? [SQL: SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) as missed_classes,
  COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) as overdue_emis,
  (COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) * 10 + COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) * 20) as risk_score
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
LEFT JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
LEFT JOIN emi_installments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY risk_score DESC
LIMIT 5]', 'Returned 5 rows in 2ms', 'success', NULL, '2026-10-17 04:25:25'),
  ('aud_ok_1792211205249_jt5e8r', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Are any trainers near double-booking or have conflicting batch hours? [SQL: SELECT t.name as trainer_name, b.name as batch_name, ts.day_of_week, ts.start_time, ts.end_time, r.name as room_name
FROM timetable_slots ts
JOIN trainers t ON t.id = ts.trainer_id
JOIN batches b ON b.id = ts.batch_id
LEFT JOIN rooms r ON r.id = ts.room_id
WHERE ts.trainer_id = ''t_vikram''
ORDER BY ts.day_of_week, ts.start_time LIMIT 50]', 'Returned 22 rows in 1ms', 'success', NULL, '2026-10-17 04:26:45'),
  ('aud_ok_1792211222611_mjy25p', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Show all details of student Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 04:27:02'),
  ('aud_ok_1792211235328_snjo28', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Who are the top 5 students most at risk of dropping out? [SQL: SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) as missed_classes,
  COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) as overdue_emis,
  (COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) * 10 + COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) * 20) as risk_score
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
LEFT JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
LEFT JOIN emi_installments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY risk_score DESC
LIMIT 5]', 'Returned 5 rows in 2ms', 'success', NULL, '2026-10-17 04:27:15'),
  ('aud_ok_1792214958912_ubyhfp', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Show all details of student Aarav Gupta [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 05:29:18'),
  ('aud_ok_1792214972853_tunom5', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my current attendance percentage and recent logs? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 05:29:32'),
  ('aud_ok_1792214995754_d0p0s', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my class schedule and timetable for this week? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 05:29:55'),
  ('aud_ok_1792217538128_ju70k5', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'sakshi [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792210727742'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 06:12:18'),
  ('aud_ok_1792217600518_3hy8l5a', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Who are the top 5 students most at risk of dropping out? [SQL: SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) as missed_classes,
  COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) as overdue_emis,
  (COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) * 10 + COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) * 20) as risk_score
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
LEFT JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
LEFT JOIN emi_installments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY risk_score DESC
LIMIT 5]', 'Returned 5 rows in 4ms', 'success', NULL, '2026-10-17 06:13:20'),
  ('aud_1792218766429', 'u_student', 'Aarav Gupta', 'student', 'STUDENT_UPLOAD_PAYMENT_PROOF', NULL, 'Student Aarav Gupta uploaded payment photo proof for Installment #2 (₹11,667, UTR: UPI/GPY/987162534019)', 'success', NULL, '2026-10-17 06:32:46'),
  ('aud_1792218766459', 'u_owner', 'Priya Sharma (Director)', 'owner', 'OWNER_VERIFIED_PAYMENT_PROOF', NULL, 'Owner verified photo proof for Aarav Gupta (Installment #2, ₹11,667, UTR: UPI/GPY/987162534019)', 'success', NULL, '2026-10-17 06:32:46'),
  ('aud_1792229822176', 'u_owner', 'Priya Sharma (Director)', 'owner', 'OWNER_VERIFIED_PAYMENT_PROOF', NULL, 'Owner verified photo proof for Ananya Deshmukh (Installment #2, ₹11,667, UTR: UPI/ICIC/471029481023)', 'success', NULL, '2026-10-17 09:37:02'),
  ('aud_ok_1792229862796_ki9asb', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my current attendance percentage and recent logs? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 09:37:42'),
  ('aud_1792229947761', 'u_owner', 'Priya Sharma (Director)', 'owner', 'OWNER_VERIFIED_PAYMENT_PROOF', NULL, 'Owner verified photo proof for Rohan Gupta (Installment #2, ₹11,667, UTR: UPI/HDFC/982731827419)', 'success', NULL, '2026-10-17 09:39:07'),
  ('aud_ok_1792229985788_lt4dtp', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my current attendance percentage and recent logs? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 2ms', 'success', NULL, '2026-10-17 09:39:45'),
  ('aud_ok_1792242152379_qp5fgc', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my current attendance percentage and recent logs? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 13:02:32'),
  ('aud_ok_1792243181569_s5kqqo', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'sakshi [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_1792210727742'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 13:19:41'),
  ('aud_ok_1792247972915_npwz68', 'u_student', 'Aarav Gupta', 'student', 'copilot_query', 'What is my current attendance percentage and recent logs? [SQL: SELECT 
  s.id, s.name, s.phone, s.email, s.status, s.join_date,
  b.name as batch_name, b.days, b.start_time, b.end_time, b.mode,
  c.name as course_name,
  t.name as trainer_name,
  r.name as room_name,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''present'') as present_count,
  (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = ''absent'') as absent_count
FROM students s
LEFT JOIN enrollments en ON en.student_id = s.id
LEFT JOIN batches b ON b.id = en.batch_id
LEFT JOIN courses c ON c.id = b.course_id
LEFT JOIN trainers t ON t.id = b.trainer_id
LEFT JOIN rooms r ON r.id = b.room_id
WHERE s.id = ''s_001'' LIMIT 50]', 'Returned 1 rows in 1ms', 'success', NULL, '2026-10-17 14:39:32'),
  ('aud_ok_1792247988511_jhcv7f', 'u_owner', 'Priya Sharma (Director)', 'owner', 'copilot_query', 'Who are the top 5 students most at risk of dropping out? [SQL: SELECT s.id, s.name, s.phone, b.name as batch_name,
  COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) as missed_classes,
  COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) as overdue_emis,
  (COUNT(CASE WHEN a.status = ''absent'' THEN 1 END) * 10 + COUNT(CASE WHEN e.status = ''overdue'' THEN 1 END) * 20) as risk_score
FROM students s
JOIN enrollments en ON en.student_id = s.id
JOIN batches b ON b.id = en.batch_id
LEFT JOIN attendance a ON a.student_id = s.id AND a.batch_id = b.id
LEFT JOIN emi_installments e ON e.student_id = s.id
GROUP BY s.id
ORDER BY risk_score DESC
LIMIT 5]', 'Returned 5 rows in 3ms', 'success', NULL, '2026-10-17 14:39:48'),
  ('aud_enr_1793077978102', 'u_owner', 'Priya Sharma', 'owner', 'student_enrolled', 'Enrolled student adi into batch b_java_m1', 'Student ID: s_1793077978100', 'success', NULL, '2026-10-27 05:12:58')
ON CONFLICT (id) DO NOTHING;
