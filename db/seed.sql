BEGIN;

WITH sample_returns AS (
    SELECT
        n,
        (ARRAY['Open', 'In Review', 'Approved', 'Rejected', 'Completed'])
            [(n - 1) % 5 + 1] AS status,
        (ARRAY['Damaged', 'Wrong Item', 'Size Issue', 'Not As Described', 'Changed Mind'])
            [(n - 1) / 6 + 1] AS reason
    FROM generate_series(1, 30) AS numbers(n)
),
with_resolution AS (
    SELECT
        *,
        CASE
            WHEN status IN ('Approved', 'Completed') THEN
                (ARRAY['Refund', 'Replacement', 'Store Credit'])[(n - 1) / 5 % 3 + 1]
        END AS resolution
    FROM sample_returns
),
inserted_returns AS (
    INSERT INTO return_requests (
        customer_name, customer_email, order_id, item_id,
        quantity, reason, status, resolution, refund_amount, created_at
    )
    SELECT
        'Demo Customer ' || n,
        'customer' || n || '@example.com',
        'DEMO-ORDER-' || LPAD(n::text, 2, '0'),
        'ITEM-' || ((n - 1) % 6 + 1),
        (n - 1) % 3 + 1,
        reason,
        status,
        resolution,
        CASE WHEN resolution = 'Refund' THEN 499.00 + n END,
        NOW() - n * INTERVAL '1 day'
    FROM with_resolution
    RETURNING id, order_id, created_at
)
INSERT INTO request_notes (request_id, body, created_at)
SELECT id, 'Customer provided the order details for this return.',
       created_at + INTERVAL '1 hour'
FROM inserted_returns
WHERE RIGHT(order_id, 2)::integer % 3 = 0;

COMMIT;