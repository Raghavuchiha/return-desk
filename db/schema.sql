BEGIN;

CREATE TABLE public.return_requests (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),

    reason VARCHAR(50) NOT NULL CHECK (
        reason IN (
            'Damaged', 'Wrong Item', 'Size Issue',
            'Not As Described', 'Changed Mind'
        )
    ),

    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (
        status IN ('Open', 'In Review', 'Approved', 'Rejected', 'Completed')
    ),

    resolution VARCHAR(20) CHECK (
        resolution IN ('Refund', 'Replacement', 'Store Credit')
    ),
    refund_amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,

    CONSTRAINT resolution_matches_status CHECK (
        (status IN ('Approved', 'Completed')) = (resolution IS NOT NULL)
    ),

    CONSTRAINT refund_amount_rules CHECK (
        CASE
            WHEN resolution = 'Refund' THEN
                refund_amount IS NOT NULL
                AND refund_amount BETWEEN 0.01 AND 99999999.99
            ELSE refund_amount IS NULL
        END
    ),

    CONSTRAINT removed_only_open_or_rejected CHECK (
        removed_at IS NULL OR status IN ('Open', 'Rejected')
    )
);

-- Block a second live return for the same order and item.
CREATE UNIQUE INDEX one_live_return_per_order_item
    ON public.return_requests (order_id, item_id)
    WHERE status IN ('Open', 'In Review', 'Approved');

-- Generate a reference such as RET-1 when a request is inserted.
CREATE FUNCTION public.set_return_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.reference := 'RET-' || NEW.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_return_reference
BEFORE INSERT ON public.return_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_return_reference();

ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

COMMIT;


begin;

CREATE TABLE request_notes (
    id         SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES return_requests(id),
    body       TEXT NOT NULL CHECK (TRIM(body) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX request_notes_chronological
    ON request_notes (request_id, created_at, id);

ALTER TABLE request_notes ENABLE ROW LEVEL SECURITY;

commit;