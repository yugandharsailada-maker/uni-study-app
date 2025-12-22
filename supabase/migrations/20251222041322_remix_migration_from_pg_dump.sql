CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'Assignment'::text NOT NULL,
    marks_obtained numeric,
    max_marks numeric DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    marks_obtained numeric,
    max_marks numeric DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT exams_type_check CHECK ((type = ANY (ARRAY['midsem'::text, 'endsem'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text,
    display_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semesters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'New Semester'::text NOT NULL,
    emoji text,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: study_materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    local_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    semester_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name text DEFAULT 'New Subject'::text NOT NULL,
    code text DEFAULT 'SUB101'::text NOT NULL,
    credits integer DEFAULT 3 NOT NULL,
    midsem_weight numeric DEFAULT 20 NOT NULL,
    endsem_weight numeric DEFAULT 40 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: study_materials study_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: semesters update_semesters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subjects update_subjects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: assignments assignments_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exams exams_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: exams exams_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: semesters semesters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: study_materials study_materials_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: study_materials study_materials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_materials
    ADD CONSTRAINT study_materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: assignments Users can delete their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own assignments" ON public.assignments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: exams Users can delete their own exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own exams" ON public.exams FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: semesters Users can delete their own semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own semesters" ON public.semesters FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: study_materials Users can delete their own study materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own study materials" ON public.study_materials FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: subjects Users can delete their own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own subjects" ON public.subjects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: assignments Users can insert their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own assignments" ON public.assignments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: exams Users can insert their own exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own exams" ON public.exams FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: semesters Users can insert their own semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own semesters" ON public.semesters FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: study_materials Users can insert their own study materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own study materials" ON public.study_materials FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: subjects Users can insert their own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own subjects" ON public.subjects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: assignments Users can update their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own assignments" ON public.assignments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: exams Users can update their own exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own exams" ON public.exams FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: semesters Users can update their own semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own semesters" ON public.semesters FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: study_materials Users can update their own study materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own study materials" ON public.study_materials FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: subjects Users can update their own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own subjects" ON public.subjects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: assignments Users can view their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own assignments" ON public.assignments FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: exams Users can view their own exams; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own exams" ON public.exams FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: semesters Users can view their own semesters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own semesters" ON public.semesters FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: study_materials Users can view their own study materials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own study materials" ON public.study_materials FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: subjects Users can view their own subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own subjects" ON public.subjects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: exams; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: semesters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

--
-- Name: study_materials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;