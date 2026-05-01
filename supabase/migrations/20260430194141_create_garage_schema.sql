/*
  # Garage ERP - Full Schema

  ## New Tables
  1. `clients` - Customer records (name, phone, email, address)
  2. `vehicles` - Vehicles linked to clients (make, model, year, plate, vin)
  3. `repairs` - Repair orders linked to vehicles (status, costs)
  4. `parts` - Parts inventory (name, quantity, unit_price)
  5. `repair_parts` - Junction table linking repairs to parts used
  6. `transactions` - Financial records linked to repairs

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write all records (single-tenant garage app)
*/

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select clients"
  ON clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE TO authenticated USING (true);

-- VEHICLES
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make text NOT NULL,
  model text NOT NULL,
  year integer DEFAULT EXTRACT(YEAR FROM now()),
  plate text DEFAULT '',
  vin text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON vehicles FOR DELETE TO authenticated USING (true);

-- REPAIRS
CREATE TABLE IF NOT EXISTS repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  labor_cost numeric(10,2) DEFAULT 0,
  parts_cost numeric(10,2) DEFAULT 0,
  total_cost numeric(10,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select repairs"
  ON repairs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert repairs"
  ON repairs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update repairs"
  ON repairs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete repairs"
  ON repairs FOR DELETE TO authenticated USING (true);

-- PARTS (inventory)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select parts"
  ON parts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert parts"
  ON parts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update parts"
  ON parts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete parts"
  ON parts FOR DELETE TO authenticated USING (true);

-- REPAIR_PARTS (junction)
CREATE TABLE IF NOT EXISTS repair_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select repair_parts"
  ON repair_parts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert repair_parts"
  ON repair_parts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update repair_parts"
  ON repair_parts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete repair_parts"
  ON repair_parts FOR DELETE TO authenticated USING (true);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id uuid REFERENCES repairs(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'income' CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select transactions"
  ON transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update transactions"
  ON transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON transactions FOR DELETE TO authenticated USING (true);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle_id ON repairs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_repair_id ON repair_parts(repair_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_part_id ON repair_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_transactions_repair_id ON transactions(repair_id);
