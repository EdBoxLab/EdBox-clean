create table public.genie_node_embeddings (
  id uuid not null default gen_random_uuid (),
  node_id uuid not null,
  content text not null,
  embedding public.vector null,
  created_at timestamp with time zone null default now(),
  constraint genie_node_embeddings_pkey primary key (id),
  constraint genie_node_embeddings_node_id_key unique (node_id),
  constraint genie_node_embeddings_node_id_fkey foreign KEY (node_id) references genie_knowledge_nodes (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.genie_knowledge_nodes (
  id uuid not null default gen_random_uuid (),
  course_id text not null,
  title text not null,
  description text null,
  content text null,
  level integer null default 1,
  order_index integer null,
  prerequisite_ids uuid[] null default array[]::uuid[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint genie_knowledge_nodes_pkey primary key (id)
) TABLESPACE pg_default;
create table public.genie_user_mastery (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  node_id uuid null,
  mastery_score numeric(5, 2) null default 0,
  status text null default 'not_started'::text,
  attempts_count integer null default 0,
  last_attempt_at timestamp with time zone null,
  constraint genie_user_mastery_pkey primary key (id),
  constraint genie_user_mastery_user_id_node_id_key unique (user_id, node_id),
  constraint genie_user_mastery_node_id_fkey foreign KEY (node_id) references genie_knowledge_nodes (id) on delete CASCADE,
  constraint genie_user_mastery_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint genie_user_mastery_status_check check (
    (
      status = any (
        array[
          'not_started'::text,
          'in_progress'::text,
          'mastered'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
create table public.interactive_course_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  course_id text not null,
  user_id uuid not null,
  current_topic text null,
  learning_context jsonb null default '{}'::jsonb,
  progress_state jsonb null default '{}'::jsonb,
  session_start_time timestamp with time zone null default now(),
  last_interaction timestamp with time zone null default now(),
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  retry_count integer null default 0,
  constraint interactive_course_sessions_pkey primary key (id),
  constraint interactive_course_sessions_user_id_course_id_is_active_key unique (user_id, course_id, is_active),
  constraint interactive_course_sessions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_interactive_sessions_user_id on public.interactive_course_sessions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_interactive_sessions_active on public.interactive_course_sessions using btree (user_id, course_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_interactive_sessions_course_id on public.interactive_course_sessions using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_interactive_sessions_last_interaction on public.interactive_course_sessions using btree (last_interaction desc) TABLESPACE pg_default;

create trigger tr_update_interactive_sessions_updated_at BEFORE
update on interactive_course_sessions for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_interactive_course_sessions_updated_at BEFORE
update on interactive_course_sessions for EACH row
execute FUNCTION update_updated_at_column ();
create table public.learner_states (
  id text not null,
  user_id uuid null,
  skill_graph_id text not null default 'default'::text,
  total_xp integer null default 0,
  level integer null default 1,
  streak integer null default 0,
  badges jsonb null default '[]'::jsonb,
  last_active timestamp with time zone null default now(),
  skill_mastery jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  current_skill text null,
  started_at timestamp with time zone null,
  constraint learner_states_pkey primary key (id),
  constraint learner_states_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.learning_loop_iterations (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  iteration_number integer not null,
  concept text not null,
  explanation_completed boolean null default false,
  assessment_completed boolean null default false,
  challenge_completed boolean null default false,
  evaluation_completed boolean null default false,
  mastery_achieved boolean null default false,
  started_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint learning_loop_iterations_pkey primary key (id),
  constraint learning_loop_iterations_session_id_fkey foreign KEY (session_id) references interactive_course_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_learning_loop_iterations_session_id on public.learning_loop_iterations using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_learning_loop_iterations_concept on public.learning_loop_iterations using btree (concept) TABLESPACE pg_default;

create index IF not exists idx_learning_loop_iterations_iteration on public.learning_loop_iterations using btree (session_id, iteration_number) TABLESPACE pg_default;
create table public.skill_configurations (
  id uuid not null default extensions.uuid_generate_v4 (),
  skill_id text not null,
  min_success_rate numeric(5, 4) null default 0.7000,
  challenges_required integer null default 3,
  max_challenges integer null default 10,
  starting_difficulty text null default 'Medium'::text,
  adaptive_scaling boolean null default true,
  challenge_types text[] null default array[]::text[],
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint skill_configurations_pkey primary key (id),
  constraint skill_configurations_skill_id_key unique (skill_id),
  constraint skill_configurations_challenges_required_check check ((challenges_required > 0)),
  constraint skill_configurations_check check ((max_challenges >= challenges_required)),
  constraint skill_configurations_min_success_rate_check check (
    (
      (min_success_rate >= (0)::numeric)
      and (min_success_rate <= (1)::numeric)
    )
  ),
  constraint skill_configurations_starting_difficulty_check check (
    (
      starting_difficulty = any (array['Easy'::text, 'Medium'::text, 'Hard'::text])
    )
  )
) TABLESPACE pg_default;

create trigger update_skill_configurations_updated_at BEFORE
update on skill_configurations for EACH row
execute FUNCTION update_updated_at_column ();
create table public.skill_graphs (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  goal text not null,
  nodes jsonb not null,
  edges jsonb not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  context jsonb null,
  total_skills integer null,
  estimated_hours text null,
  skill_paths jsonb null,
  mini_projects jsonb null,
  capstone_project jsonb null,
  constraint skill_graphs_pkey primary key (id),
  constraint skill_graphs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_skill_graphs_user_id on public.skill_graphs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_skill_graphs_created_at on public.skill_graphs using btree (created_at desc) TABLESPACE pg_default;

create trigger update_skill_graphs_updated_at BEFORE
update on skill_graphs for EACH row
execute FUNCTION update_updated_at_column ();
create table public.understanding_assessments (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  concept text not null,
  question_type text not null,
  question_data jsonb not null,
  learner_response text null,
  is_correct boolean null,
  comprehension_level numeric(3, 2) null,
  feedback text null,
  created_at timestamp with time zone null default now(),
  answered_at timestamp with time zone null,
  constraint understanding_assessments_pkey primary key (id),
  constraint understanding_assessments_session_id_fkey foreign KEY (session_id) references interactive_course_sessions (id) on delete CASCADE,
  constraint understanding_assessments_comprehension_level_check check (
    (
      (comprehension_level >= (0)::numeric)
      and (comprehension_level <= (1)::numeric)
    )
  ),
  constraint understanding_assessments_question_type_check check (
    (
      question_type = any (
        array[
          'multiple_choice'::text,
          'short_answer'::text,
          'true_false'::text,
          'drag_drop'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_understanding_assessments_session_id on public.understanding_assessments using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_understanding_assessments_concept on public.understanding_assessments using btree (concept) TABLESPACE pg_default;

create index IF not exists idx_understanding_assessments_created_at on public.understanding_assessments using btree (created_at desc) TABLESPACE pg_default;
create table public.user_competency (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  topic text not null,
  concept text not null,
  confidence double precision null default 0.0,
  mastery_state jsonb null default '{}'::jsonb,
  last_updated timestamp with time zone null default now(),
  constraint user_competency_pkey primary key (id),
  constraint user_competency_user_id_topic_concept_key unique (user_id, topic, concept),
  constraint user_competency_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists user_competency_user_id_topic_idx on public.user_competency using btree (user_id, topic) TABLESPACE pg_default;
create table public.user_skill_progress (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  skill_id text not null,
  challenges_completed integer null default 0,
  challenges_required integer null default 3,
  success_rate numeric(5, 4) null default 0.0000,
  mastery_achieved boolean null default false,
  last_attempt timestamp with time zone null,
  total_attempts integer null default 0,
  xp_earned integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_skill_progress_pkey primary key (id),
  constraint user_skill_progress_user_id_skill_id_key unique (user_id, skill_id),
  constraint user_skill_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_skill_progress_success_rate_check check (
    (
      (success_rate >= (0)::numeric)
      and (success_rate <= (1)::numeric)
    )
  )
) TABLESPACE pg_default;

create trigger update_user_skill_progress_updated_at BEFORE
update on user_skill_progress for EACH row
execute FUNCTION update_updated_at_column ();

-- Genie Decision Logging Table
create table public.genie_decision_logs (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  iteration_id uuid null,
  user_id uuid not null,
  node_id uuid not null,
  concept text not null,
  action text not null,
  thought_process text null,
  evaluation_score numeric(5, 2) null default 0,
  feedback text null,
  remediation_node_id uuid null,
  mastery_status text null,
  mastery_score numeric(5, 2) null default 0,
  conversation_history_length integer null default 0,
  context_sources_count integer null default 0,
  input_message text null,
  full_decision jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint genie_decision_logs_pkey primary key (id),
  constraint genie_decision_logs_session_id_fkey foreign KEY (session_id) references interactive_course_sessions (id) on delete CASCADE,
  constraint genie_decision_logs_iteration_id_fkey foreign KEY (iteration_id) references learning_loop_iterations (id) on delete SET NULL,
  constraint genie_decision_logs_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint genie_decision_logs_node_id_fkey foreign KEY (node_id) references genie_knowledge_nodes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_decision_logs_session_id on public.genie_decision_logs using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_decision_logs_user_id on public.genie_decision_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_decision_logs_node_id on public.genie_decision_logs using btree (node_id) TABLESPACE pg_default;

create index IF not exists idx_decision_logs_action on public.genie_decision_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_decision_logs_created_at on public.genie_decision_logs using btree (created_at desc) TABLESPACE pg_default;
