-- Populate the database with all SearchNWA team members
-- This script adds all 20 SearchNWA team members plus the existing demo users

-- Insert all SearchNWA team members
INSERT INTO users (email, password, name, phone, role) VALUES
    ('brandon@searchnwa.com', 'temp123', 'Brandon Hollis', '+1-479-685-8754', 'member'),
    ('ccarl@searchnwa.com', 'temp123', 'Carl DeBose', '+1-479-461-1333', 'member'),
    ('chris@searchnwa.com', 'temp123', 'Chris Adams', '+1-479-685-8754', 'member'),
    ('chrislee@searchnwa.com', 'temp123', 'Christopher Lee', '+1-479-685-8754', 'member'),
    ('cindy@searchnwa.com', 'temp123', 'Cindy Schell', '+1-479-685-8754', 'member'),
    ('eujeanie@searchnwa.com', 'temp123', 'Eujeanie Luker', '+1-479-685-8754', 'member'),
    ('frank@searchnwa.com', 'temp123', 'Frank Cardinale', '+1-479-685-8754', 'member'),
    ('grayson@searchnwa.com', 'temp123', 'Grayson Geurin', '+1-479-685-8754', 'member'),
    ('jacob@searchnwa.com', 'temp123', 'Jacob Fitzgerald', '+1-479-685-8754', 'member'),
    ('kim@searchnwa.com', 'temp123', 'Kimberly Carter', '+1-479-685-8754', 'member'),
    ('landon@searchnwa.com', 'temp123', 'Landon Burkett', '+1-479-685-8754', 'member'),
    ('luis@searchnwa.com', 'temp123', 'Luis Jimenez', '+1-479-685-8754', 'member'),
    ('michael@searchnwa.com', 'temp123', 'Michael Lyman', '+1-479-685-8754', 'member'),
    ('michelle@searchnwa.com', 'temp123', 'Michelle Harrison', '+1-479-685-8754', 'member'),
    ('mitch@searchnwa.com', 'temp123', 'Mitch Sluyter', '+1-479-685-8754', 'member'),
    ('lyndsi@searchnwa.com', 'temp123', 'Lyndsi Sluyter', '+1-479-685-8754', 'member'),
    ('patrick@searchnwa.com', 'temp123', 'Patrick Foresee', '+1-479-685-8754', 'member'),
    ('bill@searchnwa.com', 'temp123', 'William Burchit', '+1-479-685-8754', 'member'),
    ('natalie@searchnwa.com', 'temp123', 'Natalie Burchit', '+1-479-685-8754', 'member'),
    ('thomas@searchnwa.com', 'temp123', 'Thomas Francis', '+1-479-685-8754', 'member')
ON CONFLICT (email) DO NOTHING;

-- Verify the total count
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count
FROM users;
