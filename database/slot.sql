-- Menambah slot waktu untuk hari ini dan tiga hari ke depan tanpa menghapus data lain.
-- Slot yang sudah ada (tanggal dan jam_mulai sama) dilewati, jadi aman dijalankan berulang.
-- 07.00 sampai 16.00, satu jam per slot, kuota 4. Slot 12.00 sampai 13.00 nonaktif untuk istirahat.

USE db_antrian_truk;

INSERT INTO slot_waktu (tanggal, jam_mulai, jam_selesai, kuota, status_slot)
SELECT baru.tanggal, baru.jam_mulai, baru.jam_selesai, 4, baru.status_slot
FROM (
  SELECT
    DATE_ADD(CURDATE(), INTERVAL d.n DAY) AS tanggal,
    MAKETIME(h.n, 0, 0) AS jam_mulai,
    MAKETIME(h.n + 1, 0, 0) AS jam_selesai,
    IF(h.n = 12, 'nonaktif', 'aktif') AS status_slot,
    d.n AS urut_hari,
    h.n AS urut_jam
  FROM
    (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) d
    CROSS JOIN
    (SELECT 7 AS n UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
     UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15) h
) baru
WHERE NOT EXISTS (
  SELECT 1 FROM slot_waktu s
  WHERE s.tanggal = baru.tanggal AND s.jam_mulai = baru.jam_mulai
)
ORDER BY baru.urut_hari, baru.urut_jam;
