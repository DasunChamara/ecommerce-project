--
-- PostgreSQL database dump
--

\restrict jlbwZQEEJyXKn5GMDZ0mYhy78n8n2czb4zDiafXUJr6Ht9M0MHbznGHVDPnm6K7

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-10-19 19:15:25

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 25129)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    quantity integer DEFAULT 1 NOT NULL,
    is_selected boolean DEFAULT true,
    added_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25128)
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 225
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- TOC entry 230 (class 1259 OID 25184)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25183)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 229
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 228 (class 1259 OID 25159)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    items_total numeric(10,2) NOT NULL,
    courier_fee numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) NOT NULL,
    total_weight_kg numeric(8,3) DEFAULT 0.00,
    is_urgent boolean DEFAULT false,
    payment_method character varying(50) DEFAULT 'COD'::character varying,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    delivery_address text NOT NULL,
    delivery_latitude numeric(10,8),
    delivery_longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 25158)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 227
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 224 (class 1259 OID 25111)
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    weight character varying(50) NOT NULL,
    weight_in_kg numeric(6,3) NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 25110)
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_id_seq OWNER TO postgres;

--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 223
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- TOC entry 222 (class 1259 OID 25094)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    base_price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    image_url character varying(255),
    is_special boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_stock_quantity_check CHECK ((stock_quantity >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 25093)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 220 (class 1259 OID 25074)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone_number character varying(20),
    delivery_address text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    role character varying(50) DEFAULT 'CUSTOMER'::character varying,
    penalty_count integer DEFAULT 0,
    is_blacklisted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 25073)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4847 (class 2604 OID 25132)
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- TOC entry 4858 (class 2604 OID 25187)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 25162)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 25114)
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- TOC entry 4841 (class 2604 OID 25097)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 25077)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5046 (class 0 OID 25129)
-- Dependencies: 226
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, user_id, product_id, variant_id, quantity, is_selected, added_at) FROM stdin;
1	1	2	3	3	t	2026-10-14 20:36:45.418892
\.


--
-- TOC entry 5050 (class 0 OID 25184)
-- Dependencies: 230
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, variant_id, quantity, unit_price) FROM stdin;
1	1	7	9	1	180.00
2	2	3	5	1	1650.00
\.


--
-- TOC entry 5048 (class 0 OID 25159)
-- Dependencies: 228
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, items_total, courier_fee, total_amount, total_weight_kg, is_urgent, payment_method, status, delivery_address, delivery_latitude, delivery_longitude, created_at) FROM stdin;
1	5	180.00	259.50	439.50	0.100	t	COD	DELIVERED	No 45, Galle Road, Colombo 03	6.92710000	79.86120000	2026-10-19 02:13:53.969309
2	5	1650.00	349.50	1999.50	5.000	f	COD	PENDING	No 45, Galle Road, Colombo 03	6.92710000	79.86120000	2026-10-19 02:17:13.077849
\.


--
-- TOC entry 5044 (class 0 OID 25111)
-- Dependencies: 224
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (id, product_id, weight, weight_in_kg, price, created_at) FROM stdin;
1	1	100g Pack	0.100	1200.00	2026-10-14 11:54:22.418335
2	1	250g Pack	0.250	2800.00	2026-10-14 11:54:22.418335
3	2	100g Pack	0.100	850.00	2026-10-14 11:54:22.418335
4	2	200g Pack	0.200	1600.00	2026-10-14 11:54:22.418335
5	3	5kg Bag	5.000	1650.00	2026-10-14 11:54:22.418335
6	4	500g	0.500	340.00	2026-10-14 11:54:22.418335
7	4	1kg	1.000	680.00	2026-10-14 11:54:22.418335
8	5	1kg	1.000	280.00	2026-10-14 11:54:22.418335
9	7	100	0.100	180.00	2026-10-19 01:50:31.632094
\.


--
-- TOC entry 5042 (class 0 OID 25094)
-- Dependencies: 222
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, base_price, stock_quantity, image_url, is_special, created_at) FROM stdin;
1	Pure Ceylon Cinnamon Sticks (Alba Grade)	Premium export quality authentic Ceylon cinnamon quills. Best for foreign tourists and spice lovers.	1200.00	50	https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80	t	2026-10-14 11:54:22.418335
2	Organic Ceylon Cinnamon Powder	100% Pure organic ground Ceylon cinnamon powder with rich aroma and natural sweetness.	850.00	40	https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80	t	2026-10-14 11:54:22.418335
4	Red Dhal (Mysore Dhal)	Cleaned and sorted high-protein red lentils.	340.00	80	https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80	f	2026-10-14 11:54:22.418335
5	White Sugar (Pure Cane)	Refined pure white sugar for daily household tea and beverages.	280.00	120	https://images.unsplash.com/photo-1622484212850-cab596d66e74?auto=format&fit=crop&w=600&q=80	f	2026-10-14 11:54:22.418335
6	kaha kudu		120.00	5	https://gemini.google.com/app/685baf25abee1248	f	2026-10-19 00:57:00.500148
7	kithul flower		180.00	2	http://localhost:8081/uploads/c3790c41-7d2f-43f3-afc5-a08e29c28bec_WhatsApp_Image_2026-10-19_at_01.16.22.jpeg	f	2026-10-19 01:18:14.505635
3	Keeri Samba Rice (5kg Pack)	Premium quality polished Keeri Samba rice for daily family meals.	1650.00	99	https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80	f	2026-10-14 11:54:22.418335
\.


--
-- TOC entry 5040 (class 0 OID 25074)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, phone_number, delivery_address, latitude, longitude, role, penalty_count, is_blacklisted, created_at) FROM stdin;
1	customer@gmail.com	$2a$10$w8k2.example	0771234567	No 45, Galle Road, Colombo 03	6.92710000	79.86120000	CUSTOMER	0	f	2026-10-14 11:54:22.418335
3	admin@foodcity.lk	$2a$10$eAccYoNOHEqgkmlK/D2s.OmsqUq0.P/rT7yEksx79t1u.52q9T/yK	0711111111	Lanka Food City Head Office, Colombo 03	\N	\N	ADMIN	0	f	2026-10-16 22:29:45.616903
2	vikumchamika@gmail.com	$2a$10$xG6n21tXYRe1L//buL63/OHyImNXaPzu01dHf/TOfjmE1nT8gpQfe	0718208878	\N	6.82030610	79.89364860	ADMIN	0	f	2026-10-14 19:42:52.42998
4	hashinithilakshana@gmail.com	$2a$10$TtPaU27wovc2OjShamd5QOoTVdu08Qjn8L.Q/oVl.pJz/RImkOkwe	0741234567	elpitiya	6.82607300	79.90514500	CUSTOMER	0	f	2026-10-18 09:56:17.539804
5	samanjayalath@gmail.com	$2a$10$RPWGZ/wIi0cCE8xSj/5qsuN7Nx7/FQwZfipA.P8V6MuiWBLz9XZW.	0775432714	No 100,kadawala Road,Rathmalana	6.22036600	80.16945450	CUSTOMER	0	f	2026-10-18 10:06:37.707767
\.


--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 225
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 2, true);


--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 229
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 2, true);


--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 227
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 2, true);


--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 223
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 9, true);


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 221
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 7, true);


--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- TOC entry 4875 (class 2606 OID 25142)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 25195)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 25177)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 25122)
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- TOC entry 4871 (class 2606 OID 25109)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 25090)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4866 (class 2606 OID 25092)
-- Name: users users_phone_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_key UNIQUE (phone_number);


--
-- TOC entry 4868 (class 2606 OID 25088)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 1259 OID 25213)
-- Name: idx_cart_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_user ON public.cart_items USING btree (user_id);


--
-- TOC entry 4877 (class 1259 OID 25215)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4878 (class 1259 OID 25216)
-- Name: idx_orders_urgent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_urgent ON public.orders USING btree (is_urgent);


--
-- TOC entry 4879 (class 1259 OID 25214)
-- Name: idx_orders_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user ON public.orders USING btree (user_id);


--
-- TOC entry 4869 (class 1259 OID 25212)
-- Name: idx_products_special; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_special ON public.products USING btree (is_special);


--
-- TOC entry 4862 (class 1259 OID 25211)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4885 (class 2606 OID 25148)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4886 (class 2606 OID 25143)
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 25153)
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- TOC entry 4889 (class 2606 OID 25196)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 25201)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- TOC entry 4891 (class 2606 OID 25206)
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE RESTRICT;


--
-- TOC entry 4888 (class 2606 OID 25178)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4884 (class 2606 OID 25123)
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO ecommerce_user;


--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE cart_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.cart_items TO ecommerce_user;


--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 225
-- Name: SEQUENCE cart_items_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cart_items_id_seq TO ecommerce_user;


--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.order_items TO ecommerce_user;


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 229
-- Name: SEQUENCE order_items_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.order_items_id_seq TO ecommerce_user;


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.orders TO ecommerce_user;


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 227
-- Name: SEQUENCE orders_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.orders_id_seq TO ecommerce_user;


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE product_variants; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.product_variants TO ecommerce_user;


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 223
-- Name: SEQUENCE product_variants_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.product_variants_id_seq TO ecommerce_user;


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.products TO ecommerce_user;


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 221
-- Name: SEQUENCE products_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.products_id_seq TO ecommerce_user;


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO ecommerce_user;


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 219
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO ecommerce_user;


--
-- TOC entry 2078 (class 826 OID 25072)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO ecommerce_user;


--
-- TOC entry 2077 (class 826 OID 25071)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO ecommerce_user;


-- Completed on 2026-10-19 19:15:25

--
-- PostgreSQL database dump complete
--

\unrestrict jlbwZQEEJyXKn5GMDZ0mYhy78n8n2czb4zDiafXUJr6Ht9M0MHbznGHVDPnm6K7

