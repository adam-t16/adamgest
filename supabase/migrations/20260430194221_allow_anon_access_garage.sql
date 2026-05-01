/*
  # Allow anon access for single-tenant garage ERP

  Since this is a single-tenant internal tool without user auth,
  we grant full CRUD access to the anon role on all garage tables.

  This drops the authenticated-only policies and replaces them
  with policies that also allow the anon role.
*/

-- CLIENTS
DROP POLICY IF EXISTS "Authenticated users can select clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;

CREATE POLICY "Allow all select on clients" ON clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on clients" ON clients FOR DELETE TO anon, authenticated USING (true);

-- VEHICLES
DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;

CREATE POLICY "Allow all select on vehicles" ON vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on vehicles" ON vehicles FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on vehicles" ON vehicles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on vehicles" ON vehicles FOR DELETE TO anon, authenticated USING (true);

-- REPAIRS
DROP POLICY IF EXISTS "Authenticated users can select repairs" ON repairs;
DROP POLICY IF EXISTS "Authenticated users can insert repairs" ON repairs;
DROP POLICY IF EXISTS "Authenticated users can update repairs" ON repairs;
DROP POLICY IF EXISTS "Authenticated users can delete repairs" ON repairs;

CREATE POLICY "Allow all select on repairs" ON repairs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on repairs" ON repairs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on repairs" ON repairs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on repairs" ON repairs FOR DELETE TO anon, authenticated USING (true);

-- PARTS
DROP POLICY IF EXISTS "Authenticated users can select parts" ON parts;
DROP POLICY IF EXISTS "Authenticated users can insert parts" ON parts;
DROP POLICY IF EXISTS "Authenticated users can update parts" ON parts;
DROP POLICY IF EXISTS "Authenticated users can delete parts" ON parts;

CREATE POLICY "Allow all select on parts" ON parts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on parts" ON parts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on parts" ON parts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on parts" ON parts FOR DELETE TO anon, authenticated USING (true);

-- REPAIR_PARTS
DROP POLICY IF EXISTS "Authenticated users can select repair_parts" ON repair_parts;
DROP POLICY IF EXISTS "Authenticated users can insert repair_parts" ON repair_parts;
DROP POLICY IF EXISTS "Authenticated users can update repair_parts" ON repair_parts;
DROP POLICY IF EXISTS "Authenticated users can delete repair_parts" ON repair_parts;

CREATE POLICY "Allow all select on repair_parts" ON repair_parts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on repair_parts" ON repair_parts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on repair_parts" ON repair_parts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on repair_parts" ON repair_parts FOR DELETE TO anon, authenticated USING (true);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Authenticated users can select transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;

CREATE POLICY "Allow all select on transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all insert on transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all update on transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all delete on transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);
