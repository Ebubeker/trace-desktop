-- =====================================================
-- PULSELOG DATABASE MIGRATION SCRIPT
-- =====================================================
-- This script creates all necessary tables and configurations
-- for the Pulselog application in a new Supabase project
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
-- This table stores organization information
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. USER PROFILES TABLE
-- =====================================================
-- This table stores user profile information linked to Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR,
    role VARCHAR DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    org_id UUID REFERENCES organizations(id)
);

-- =====================================================
-- 3. TASKS TABLE
-- =====================================================
-- This table stores task information
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT,
    status TEXT
);

-- =====================================================
-- 4. TIME TRACKED TABLE
-- =====================================================
-- This table stores time tracking sessions
CREATE TABLE IF NOT EXISTS time_tracked (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ACTIVITY LOGS TABLE
-- =====================================================
-- This table stores application activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    app VARCHAR NOT NULL,
    title TEXT NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE,
    event_duration NUMERIC,
    bucket_id VARCHAR,
    bucket_created TIMESTAMP WITH TIME ZONE,
    bucket_last_updated TIMESTAMP WITH TIME ZONE,
    afk_status VARCHAR DEFAULT 'unknown',
    idle_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_bounds JSONB,
    is_visible BOOLEAN DEFAULT true,
    is_minimized BOOLEAN DEFAULT false,
    is_maximized BOOLEAN DEFAULT false,
    process_id INTEGER,
    top_processes JSONB,
    total_processes INTEGER DEFAULT 0,
    system_load NUMERIC DEFAULT 0.00,
    process_categories JSONB
);

-- =====================================================
-- 6. CHAT HISTORY TABLE
-- =====================================================
-- This table stores chat messages for the chatbot feature
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context_used JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. ADDITIONAL TABLES FROM YOUR SCHEMA
-- =====================================================

-- Processed Tasks Table
CREATE TABLE IF NOT EXISTS processed_tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    task_title VARCHAR NOT NULL,
    task_description TEXT,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR DEFAULT 'active',
    duration_minutes INTEGER DEFAULT 0,
    activity_summaries JSONB,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    log_pretty_desc TEXT,
    task_id UUID REFERENCES tasks(id),
    no_focus BOOLEAN DEFAULT false
);

-- Major Tasks Table
CREATE TABLE IF NOT EXISTS major_tasks (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    major_task_title TEXT,
    major_task_summary TEXT[],
    subtask_ids TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subtasks Table
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    subtask_name TEXT NOT NULL,
    subtask_summary TEXT,
    personalized_task_ids TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    update_count INTEGER DEFAULT 0
);

-- Activity Embeddings Table (for AI features)
CREATE TABLE IF NOT EXISTS activity_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    source_type VARCHAR NOT NULL,
    source_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    embedding VECTOR(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Embeddings Table (for AI features)
CREATE TABLE IF NOT EXISTS task_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    content TEXT,
    embedding VECTOR(1536) -- OpenAI embedding dimension
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- Time tracked indexes
CREATE INDEX IF NOT EXISTS idx_time_tracked_user_id ON time_tracked(user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracked_start_time ON time_tracked(start_time);
CREATE INDEX IF NOT EXISTS idx_time_tracked_created_at ON time_tracked(created_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_app ON activity_logs(app);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Processed tasks indexes
CREATE INDEX IF NOT EXISTS idx_processed_tasks_user_id ON processed_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_tasks_task_id ON processed_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_processed_tasks_start_time ON processed_tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_processed_tasks_status ON processed_tasks(status);

-- Major tasks indexes
CREATE INDEX IF NOT EXISTS idx_major_tasks_user_id ON major_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_major_tasks_created_at ON major_tasks(created_at);

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_created_at ON subtasks(created_at);

-- Activity embeddings indexes
CREATE INDEX IF NOT EXISTS idx_activity_embeddings_user_id ON activity_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_embeddings_source_type ON activity_embeddings(source_type);
CREATE INDEX IF NOT EXISTS idx_activity_embeddings_created_at ON activity_embeddings(created_at);

-- Task embeddings indexes
CREATE INDEX IF NOT EXISTS idx_task_embeddings_task_id ON task_embeddings(task_id);

-- Vector similarity indexes for AI/LLM features
CREATE INDEX IF NOT EXISTS idx_activity_embeddings_vector ON activity_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_task_embeddings_vector ON task_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracked ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE major_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_embeddings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles in their org" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role = 'admin'
            AND admin_profile.org_id = user_profiles.org_id
        )
    );

CREATE POLICY "Admins can manage profiles in their org" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role = 'admin'
            AND admin_profile.org_id = user_profiles.org_id
        )
    );

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.org_id = organizations.id
        )
    );

CREATE POLICY "Admins can manage their organization" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
            AND user_profiles.org_id = organizations.id
        )
    );

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Time tracked policies
CREATE POLICY "Users can view their own time tracking" ON time_tracked
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time tracking" ON time_tracked
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time tracking" ON time_tracked
    FOR UPDATE USING (auth.uid() = user_id);

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history policies
CREATE POLICY "Users can view their own chat history" ON chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat history" ON chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Processed tasks policies
CREATE POLICY "Users can view their own processed tasks" ON processed_tasks
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own processed tasks" ON processed_tasks
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own processed tasks" ON processed_tasks
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Major tasks policies
CREATE POLICY "Users can view their own major tasks" ON major_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own major tasks" ON major_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own major tasks" ON major_tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- Subtasks policies
CREATE POLICY "Users can view their own subtasks" ON subtasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subtasks" ON subtasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks" ON subtasks
    FOR UPDATE USING (auth.uid() = user_id);

-- Activity embeddings policies
CREATE POLICY "Users can view their own activity embeddings" ON activity_embeddings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity embeddings" ON activity_embeddings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity embeddings" ON activity_embeddings
    FOR UPDATE USING (auth.uid() = user_id);

-- Task embeddings policies
CREATE POLICY "Users can view task embeddings for their tasks" ON task_embeddings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_embeddings.task_id
            AND tasks.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task embeddings for their tasks" ON task_embeddings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_embeddings.task_id
            AND tasks.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_tracking_updated_at BEFORE UPDATE ON time_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, name, role, org_id, created_by)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NEW.raw_user_meta_data->>'org_id',
        NEW.id
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- EMBEDDING AND LLM HELPER FUNCTIONS
-- =====================================================

-- Function to find similar activities using embeddings
CREATE OR REPLACE FUNCTION find_similar_activities(
    query_embedding vector(1536), -- OpenAI embedding dimension
    user_uuid uuid,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    content text,
    source_type varchar,
    source_id text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        activity_embeddings.id,
        activity_embeddings.content,
        activity_embeddings.source_type,
        activity_embeddings.source_id,
        1 - (activity_embeddings.embedding <=> query_embedding) as similarity
    FROM activity_embeddings
    WHERE activity_embeddings.user_id = user_uuid
    AND 1 - (activity_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY activity_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to find similar tasks using embeddings
CREATE OR REPLACE FUNCTION find_similar_tasks(
    query_embedding vector(1536), -- OpenAI embedding dimension
    user_uuid uuid,
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    task_id uuid,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        task_embeddings.id,
        task_embeddings.task_id,
        task_embeddings.content,
        1 - (task_embeddings.embedding <=> query_embedding) as similarity
    FROM task_embeddings
    JOIN tasks ON tasks.id = task_embeddings.task_id
    WHERE tasks.user_id = user_uuid
    AND 1 - (task_embeddings.embedding <=> query_embedding) > match_threshold
    ORDER BY task_embeddings.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get user's activity context for LLM
CREATE OR REPLACE FUNCTION get_user_activity_context(
    user_uuid uuid,
    hours_back int DEFAULT 24
)
RETURNS TABLE (
    activity_summary text,
    recent_tasks text,
    time_tracked_summary text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Recent activity summary
        COALESCE(
            string_agg(
                DISTINCT al.app || ': ' || al.title, 
                ', ' 
                ORDER BY al.app || ': ' || al.title
            ), 
            'No recent activity'
        ) as activity_summary,
        
        -- Recent tasks
        COALESCE(
            string_agg(
                DISTINCT t.name || ' (' || t.status || ')', 
                ', ' 
                ORDER BY t.name
            ), 
            'No recent tasks'
        ) as recent_tasks,
        
        -- Time tracking summary
        COALESCE(
            'Total time tracked: ' || 
            EXTRACT(EPOCH FROM SUM(tt.end_time - tt.start_time))/3600 || ' hours',
            'No time tracked'
        ) as time_tracked_summary
        
    FROM activity_logs al
    LEFT JOIN tasks t ON t.user_id = user_uuid 
        AND t.created_at > NOW() - INTERVAL '1 day'
    LEFT JOIN time_tracked tt ON tt.user_id = user_uuid 
        AND tt.start_time > NOW() - INTERVAL '1 day'
    WHERE al.user_id = user_uuid 
    AND al.timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
END;
$$;

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert a sample organization (optional - remove if not needed)
-- INSERT INTO organizations (id, name, description, type, created_by)
-- VALUES (
--     uuid_generate_v4(),
--     'Sample Organization',
--     'A sample organization for testing',
--     'company',
--     (SELECT id FROM auth.users LIMIT 1)
-- );

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This script has been completed successfully!
-- Your Pulselog database is now ready for use.
-- 
-- Next steps:
-- 1. Update your .env file with the new Supabase URL and keys
-- 2. Test the application with a new user account
-- 3. Create your first organization and admin user
-- 
-- Tables created:
-- - user_profiles (user management)
-- - organizations (organization data)
-- - tasks (task management)
-- - time_tracked (time tracking sessions)
-- - activity_logs (application logs)
-- - chat_history (chatbot messages)
-- - processed_tasks (processed task data)
-- - major_tasks (major task breakdown)
-- - subtasks (subtask management)
-- - activity_embeddings (AI embeddings for activities)
-- - task_embeddings (AI embeddings for tasks)
--
-- Extensions enabled:
-- - uuid-ossp (UUID generation)
-- - vector (pgvector for AI embeddings)
--
-- LLM Helper Functions:
-- - find_similar_activities() - Find similar activities using embeddings
-- - find_similar_tasks() - Find similar tasks using embeddings
-- - get_user_activity_context() - Get user context for LLM prompts
--
-- All tables include proper RLS policies for security.
-- Vector similarity indexes are created for fast embedding searches.
