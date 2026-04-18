--
-- PostgreSQL database dump
--

\restrict kMi8cKgTh4tv7SuU4OFxlfMmm7zM3FoqkWvoxJw66iWFePcnXiIfSqZwtck4qNc

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'nuevo',
    'en_proceso',
    'rechazado',
    'contratado'
);


ALTER TYPE public."ApplicationStatus" OWNER TO portal;

--
-- Name: Experiencia; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."Experiencia" AS ENUM (
    'junior',
    'mid',
    'senior',
    'lead'
);


ALTER TYPE public."Experiencia" OWNER TO portal;

--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."ResourceType" AS ENUM (
    'articulo',
    'tutorial',
    'video'
);


ALTER TYPE public."ResourceType" OWNER TO portal;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."Role" AS ENUM (
    'SUPERADMIN',
    'EMPRESA',
    'CANDIDATO'
);


ALTER TYPE public."Role" OWNER TO portal;

--
-- Name: TipoContrato; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."TipoContrato" AS ENUM (
    'completo',
    'medio',
    'temporal',
    'freelance'
);


ALTER TYPE public."TipoContrato" OWNER TO portal;

--
-- Name: TipoTrabajo; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."TipoTrabajo" AS ENUM (
    'presencial',
    'remoto',
    'hibrido'
);


ALTER TYPE public."TipoTrabajo" OWNER TO portal;

--
-- Name: VacancyStatus; Type: TYPE; Schema: public; Owner: portal
--

CREATE TYPE public."VacancyStatus" AS ENUM (
    'activa',
    'pausada',
    'cerrada',
    'rechazada'
);


ALTER TYPE public."VacancyStatus" OWNER TO portal;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO portal;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.alerts (
    id text NOT NULL,
    user_id text NOT NULL,
    keyword text NOT NULL,
    ubicacion text,
    tipo_trabajo text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.alerts OWNER TO portal;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.applications (
    id text NOT NULL,
    vacancy_id text NOT NULL,
    user_id text NOT NULL,
    status public."ApplicationStatus" DEFAULT 'nuevo'::public."ApplicationStatus" NOT NULL,
    cv_snapshot text NOT NULL,
    mensaje text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.applications OWNER TO portal;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.companies (
    id text NOT NULL,
    user_id text NOT NULL,
    nombre text NOT NULL,
    descripcion text NOT NULL,
    logo_url text,
    sitio_web text,
    ubicacion text NOT NULL,
    industria text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO portal;

--
-- Name: forum_categories; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.forum_categories (
    id text NOT NULL,
    nombre text NOT NULL,
    descripcion text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.forum_categories OWNER TO portal;

--
-- Name: forum_replies; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.forum_replies (
    id text NOT NULL,
    thread_id text NOT NULL,
    user_id text NOT NULL,
    contenido text NOT NULL,
    is_approved boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.forum_replies OWNER TO portal;

--
-- Name: forum_threads; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.forum_threads (
    id text NOT NULL,
    category_id text NOT NULL,
    user_id text NOT NULL,
    titulo text NOT NULL,
    contenido text NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    is_approved boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.forum_threads OWNER TO portal;

--
-- Name: resources; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.resources (
    id text NOT NULL,
    titulo text NOT NULL,
    contenido text NOT NULL,
    tipo public."ResourceType" NOT NULL,
    imagen_url text,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.resources OWNER TO portal;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    user_id text NOT NULL,
    company_id text NOT NULL,
    rating integer NOT NULL,
    comentario text NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO portal;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    session_token text NOT NULL,
    user_id text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO portal;

--
-- Name: users; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    password_hash text,
    role public."Role" DEFAULT 'CANDIDATO'::public."Role" NOT NULL,
    nombre text,
    apellidos text,
    telefono text,
    avatar_url text,
    cv_url text,
    empresa_nombre text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO portal;

--
-- Name: vacancies; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.vacancies (
    id text NOT NULL,
    company_id text NOT NULL,
    titulo text NOT NULL,
    descripcion text NOT NULL,
    requisitos text NOT NULL,
    ubicacion text NOT NULL,
    tipo_trabajo public."TipoTrabajo" NOT NULL,
    tipo_contrato public."TipoContrato" NOT NULL,
    salario_min numeric(65,30),
    salario_max numeric(65,30),
    experiencia public."Experiencia" NOT NULL,
    contacto text NOT NULL,
    status public."VacancyStatus" DEFAULT 'activa'::public."VacancyStatus" NOT NULL,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.vacancies OWNER TO portal;

--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: portal
--

CREATE TABLE public.verification_tokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.verification_tokens OWNER TO portal;

--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: forum_categories forum_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_categories
    ADD CONSTRAINT forum_categories_pkey PRIMARY KEY (id);


--
-- Name: forum_replies forum_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_pkey PRIMARY KEY (id);


--
-- Name: forum_threads forum_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vacancies vacancies_pkey; Type: CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.vacancies
    ADD CONSTRAINT vacancies_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_provider_account_id_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX accounts_provider_provider_account_id_key ON public.accounts USING btree (provider, provider_account_id);


--
-- Name: applications_vacancy_id_user_id_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX applications_vacancy_id_user_id_key ON public.applications USING btree (vacancy_id, user_id);


--
-- Name: companies_user_id_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX companies_user_id_key ON public.companies USING btree (user_id);


--
-- Name: reviews_user_id_company_id_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX reviews_user_id_company_id_key ON public.reviews USING btree (user_id, company_id);


--
-- Name: sessions_session_token_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX sessions_session_token_key ON public.sessions USING btree (session_token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verification_tokens_identifier_token_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX verification_tokens_identifier_token_key ON public.verification_tokens USING btree (identifier, token);


--
-- Name: verification_tokens_token_key; Type: INDEX; Schema: public; Owner: portal
--

CREATE UNIQUE INDEX verification_tokens_token_key ON public.verification_tokens USING btree (token);


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alerts alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: applications applications_vacancy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_vacancy_id_fkey FOREIGN KEY (vacancy_id) REFERENCES public.vacancies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: companies companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: forum_replies forum_replies_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.forum_threads(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: forum_replies forum_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_replies
    ADD CONSTRAINT forum_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: forum_threads forum_threads_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.forum_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: forum_threads forum_threads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.forum_threads
    ADD CONSTRAINT forum_threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: vacancies vacancies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: portal
--

ALTER TABLE ONLY public.vacancies
    ADD CONSTRAINT vacancies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict kMi8cKgTh4tv7SuU4OFxlfMmm7zM3FoqkWvoxJw66iWFePcnXiIfSqZwtck4qNc

