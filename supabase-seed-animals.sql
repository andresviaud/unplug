-- Seed default animals for Cambiora
-- Run this AFTER running supabase-schema.sql
-- This creates 4 default animals with simple node layouts

-- Bird (14 nodes) - Simple shape, first animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Bird',
  14,
  '[
    {"x": 20, "y": 30}, {"x": 30, "y": 25}, {"x": 40, "y": 20}, {"x": 50, "y": 18},
    {"x": 60, "y": 20}, {"x": 70, "y": 25}, {"x": 80, "y": 30}, {"x": 75, "y": 40},
    {"x": 65, "y": 45}, {"x": 50, "y": 48}, {"x": 35, "y": 45}, {"x": 25, "y": 40},
    {"x": 50, "y": 35}, {"x": 50, "y": 25}
  ]'::jsonb,
  1
) ON CONFLICT (name) DO NOTHING;

-- Fox (18 nodes) - Second animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Fox',
  18,
  '[
    {"x": 25, "y": 25}, {"x": 35, "y": 20}, {"x": 45, "y": 18}, {"x": 55, "y": 17},
    {"x": 65, "y": 18}, {"x": 75, "y": 20}, {"x": 80, "y": 25}, {"x": 82, "y": 30},
    {"x": 80, "y": 35}, {"x": 75, "y": 40}, {"x": 65, "y": 45}, {"x": 55, "y": 48},
    {"x": 45, "y": 48}, {"x": 35, "y": 45}, {"x": 25, "y": 40}, {"x": 20, "y": 35},
    {"x": 18, "y": 30}, {"x": 50, "y": 30}
  ]'::jsonb,
  2
) ON CONFLICT (name) DO NOTHING;

-- Deer (21 nodes) - Third animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Deer',
  21,
  '[
    {"x": 30, "y": 15}, {"x": 40, "y": 12}, {"x": 50, "y": 10}, {"x": 60, "y": 12},
    {"x": 70, "y": 15}, {"x": 75, "y": 20}, {"x": 78, "y": 25}, {"x": 80, "y": 30},
    {"x": 78, "y": 35}, {"x": 75, "y": 40}, {"x": 70, "y": 45}, {"x": 60, "y": 48},
    {"x": 50, "y": 50}, {"x": 40, "y": 48}, {"x": 30, "y": 45}, {"x": 25, "y": 40},
    {"x": 22, "y": 35}, {"x": 20, "y": 30}, {"x": 22, "y": 25}, {"x": 25, "y": 20},
    {"x": 50, "y": 30}
  ]'::jsonb,
  3
) ON CONFLICT (name) DO NOTHING;

-- Whale (24 nodes) - Fourth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Whale',
  24,
  '[
    {"x": 15, "y": 40}, {"x": 20, "y": 35}, {"x": 25, "y": 30}, {"x": 30, "y": 28},
    {"x": 35, "y": 27}, {"x": 40, "y": 26}, {"x": 45, "y": 25}, {"x": 50, "y": 24},
    {"x": 55, "y": 25}, {"x": 60, "y": 26}, {"x": 65, "y": 27}, {"x": 70, "y": 28},
    {"x": 75, "y": 30}, {"x": 80, "y": 35}, {"x": 82, "y": 40}, {"x": 80, "y": 45},
    {"x": 75, "y": 50}, {"x": 70, "y": 52}, {"x": 65, "y": 53}, {"x": 60, "y": 54},
    {"x": 55, "y": 55}, {"x": 50, "y": 56}, {"x": 45, "y": 55}, {"x": 40, "y": 54}
  ]'::jsonb,
  4
) ON CONFLICT (name) DO NOTHING;


