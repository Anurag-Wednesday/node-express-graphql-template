CREATE TABLE phone_numbers (
    id serial NOT NULL PRIMARY KEY,
    number text NOT NULL,
    address_id integer NOT NULL,
    created_at timestamp WITH time zone DEFAULT NOW(),
    updated_at timestamp WITH time zone,
    deleted_at timestamp WITH time zone,
    CONSTRAINT suppliers_address_id FOREIGN KEY (address_id) REFERENCES addresses (id)
);
CREATE INDEX address_id ON phone_numbers USING btree (address_id);