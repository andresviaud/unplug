-- Add More Animals to Cambiora Database
-- Run this SQL in your Supabase SQL Editor
-- This adds 6 more animals (total of 10 animals) for variety

-- Elephant (20 nodes) - Fifth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Elephant',
  20,
  '[
    {"x": 30, "y": 25}, {"x": 40, "y": 20}, {"x": 50, "y": 18}, {"x": 60, "y": 17},
    {"x": 70, "y": 18}, {"x": 75, "y": 22}, {"x": 78, "y": 28}, {"x": 80, "y": 35},
    {"x": 78, "y": 42}, {"x": 75, "y": 48}, {"x": 70, "y": 52}, {"x": 60, "y": 55},
    {"x": 50, "y": 56}, {"x": 40, "y": 55}, {"x": 30, "y": 52}, {"x": 25, "y": 48},
    {"x": 22, "y": 42}, {"x": 20, "y": 35}, {"x": 22, "y": 28}, {"x": 25, "y": 22}
  ]'::jsonb,
  5
) ON CONFLICT (name) DO NOTHING;

-- Lion (22 nodes) - Sixth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Lion',
  22,
  '[
    {"x": 28, "y": 22}, {"x": 35, "y": 18}, {"x": 42, "y": 16}, {"x": 50, "y": 15},
    {"x": 58, "y": 16}, {"x": 65, "y": 18}, {"x": 72, "y": 22}, {"x": 75, "y": 28},
    {"x": 76, "y": 35}, {"x": 75, "y": 42}, {"x": 72, "y": 48}, {"x": 65, "y": 52},
    {"x": 58, "y": 54}, {"x": 50, "y": 55}, {"x": 42, "y": 54}, {"x": 35, "y": 52},
    {"x": 28, "y": 48}, {"x": 25, "y": 42}, {"x": 24, "y": 35}, {"x": 25, "y": 28},
    {"x": 50, "y": 30}, {"x": 50, "y": 40}
  ]'::jsonb,
  6
) ON CONFLICT (name) DO NOTHING;

-- Dolphin (18 nodes) - Seventh animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Dolphin',
  18,
  '[
    {"x": 20, "y": 45}, {"x": 25, "y": 40}, {"x": 30, "y": 35}, {"x": 35, "y": 32},
    {"x": 40, "y": 30}, {"x": 45, "y": 28}, {"x": 50, "y": 27}, {"x": 55, "y": 28},
    {"x": 60, "y": 30}, {"x": 65, "y": 32}, {"x": 70, "y": 35}, {"x": 75, "y": 40},
    {"x": 78, "y": 45}, {"x": 75, "y": 50}, {"x": 70, "y": 53}, {"x": 65, "y": 55},
    {"x": 60, "y": 57}, {"x": 55, "y": 58}
  ]'::jsonb,
  7
) ON CONFLICT (name) DO NOTHING;

-- Bear (25 nodes) - Eighth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Bear',
  25,
  '[
    {"x": 25, "y": 20}, {"x": 32, "y": 16}, {"x": 40, "y": 14}, {"x": 48, "y": 13},
    {"x": 52, "y": 12}, {"x": 60, "y": 13}, {"x": 68, "y": 14}, {"x": 75, "y": 16},
    {"x": 80, "y": 20}, {"x": 82, "y": 25}, {"x": 83, "y": 30}, {"x": 84, "y": 35},
    {"x": 83, "y": 40}, {"x": 82, "y": 45}, {"x": 80, "y": 50}, {"x": 75, "y": 54},
    {"x": 68, "y": 56}, {"x": 60, "y": 57}, {"x": 52, "y": 58}, {"x": 48, "y": 57},
    {"x": 40, "y": 56}, {"x": 32, "y": 54}, {"x": 25, "y": 50}, {"x": 22, "y": 45},
    {"x": 50, "y": 30}
  ]'::jsonb,
  8
) ON CONFLICT (name) DO NOTHING;

-- Tiger (23 nodes) - Ninth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Tiger',
  23,
  '[
    {"x": 26, "y": 24}, {"x": 33, "y": 20}, {"x": 40, "y": 17}, {"x": 47, "y": 16},
    {"x": 53, "y": 15}, {"x": 60, "y": 16}, {"x": 67, "y": 17}, {"x": 74, "y": 20},
    {"x": 78, "y": 24}, {"x": 80, "y": 30}, {"x": 81, "y": 36}, {"x": 80, "y": 42},
    {"x": 78, "y": 48}, {"x": 74, "y": 52}, {"x": 67, "y": 55}, {"x": 60, "y": 56},
    {"x": 53, "y": 57}, {"x": 47, "y": 56}, {"x": 40, "y": 55}, {"x": 33, "y": 52},
    {"x": 26, "y": 48}, {"x": 24, "y": 42}, {"x": 50, "y": 30}
  ]'::jsonb,
  9
) ON CONFLICT (name) DO NOTHING;

-- Wolf (19 nodes) - Tenth animal
INSERT INTO animals (name, total_nodes, nodes, order_index) VALUES (
  'Wolf',
  19,
  '[
    {"x": 27, "y": 28}, {"x": 34, "y": 24}, {"x": 42, "y": 21}, {"x": 50, "y": 20},
    {"x": 58, "y": 21}, {"x": 66, "y": 24}, {"x": 73, "y": 28}, {"x": 76, "y": 33},
    {"x": 77, "y": 38}, {"x": 76, "y": 43}, {"x": 73, "y": 48}, {"x": 66, "y": 52},
    {"x": 58, "y": 55}, {"x": 50, "y": 56}, {"x": 42, "y": 55}, {"x": 34, "y": 52},
    {"x": 27, "y": 48}, {"x": 24, "y": 43}, {"x": 50, "y": 30}
  ]'::jsonb,
  10
) ON CONFLICT (name) DO NOTHING;

-- Verify the animals were added
-- SELECT name, total_nodes, order_index FROM animals ORDER BY order_index;

