-- Migration: Insert seed data for AI Recipe Keeper
-- Purpose: Add initial tag data for recipe categorization
-- Tables affected: tags
-- Notes: These are the basic tags that will be available to all users for organizing recipes

-- insert basic recipe tags
-- these provide common categorization options for recipes
-- all tags are active by default and ready for use
insert into tags (name, slug) values
    ('Śniadanie', 'sniadanie'),
    ('Obiad', 'obiad'),
    ('Kolacja', 'kolacja'),
    ('Deser', 'deser'),
    ('Przekąska', 'przekaska'),
    ('Wegańskie', 'weganskie'),
    ('Wegetariańskie', 'wegetarianskie'),
    ('Bezglutenowe', 'bezglutenowe'),
    ('Szybkie', 'szybkie'),
    ('Zupa', 'zupa'),
    ('Sałatka', 'salatka'),
    ('Ciasto', 'ciasto'),
    ('Napój', 'napoj'),
    ('Smoothie', 'smoothie'),
    ('Makaron', 'makaron'),
    ('Ryż', 'ryz'),
    ('Mięsne', 'miesne'),
    ('Rybne', 'rybne'),
    ('Owoce morza', 'owoce-morza'),
    ('Grill', 'grill'); 