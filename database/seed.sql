-- Data awal Loory Token
-- Kata sandi (di-hash dengan bcrypt):
--   manajemen@loory.test  manajemen123
--   petugas@loory.test    petugas123
--   sopir1@loory.test     sopir123
--   sopir2@loory.test     sopir123

USE db_antrian_truk;

INSERT INTO pengguna (id_pengguna, nama, email, no_hp, password, role) VALUES
  (1, 'Hendra Wijaya',  'manajemen@loory.test', '081234500001', '$2b$10$xCXR08wcIrmKxOf2NMEWu.Ro9KbHmHvDi8pGLCZAXDY.Rn4pc4E7K', 'manajemen'),
  (2, 'Rina Kartika',   'petugas@loory.test',   '081234500002', '$2b$10$cJGKfhB8kzhH/T8jBQ/H/.VheKv5u0VTCy.m5ZkMdW9TBk0OQgWam', 'petugas'),
  (3, 'Budi Santoso',   'sopir1@loory.test',    '081234500003', '$2b$10$5LxfKBQNFKHOrbCZqAR1NeaE28PHxMxzEVto9b2zAx0R.l5.SSUy2', 'sopir'),
  (4, 'Agus Prasetyo',  'sopir2@loory.test',    '081234500004', '$2b$10$5LxfKBQNFKHOrbCZqAR1NeaE28PHxMxzEVto9b2zAx0R.l5.SSUy2', 'sopir');

-- kapasitas_muatan dalam kilogram
INSERT INTO truk (id_truk, id_pengguna, no_polisi, jenis_truk, kapasitas_muatan, foto_truk) VALUES
  (1, 3, 'B 9123 KXT', 'Wingbox', 15000, NULL),
  (2, 4, 'B 9478 UYZ', 'Tronton', 20000, NULL);

INSERT INTO loading_dock (id_dock, nama_dock, status_dock, keterangan) VALUES
  (1, 'Dock 1', 'tersedia', NULL),
  (2, 'Dock 2', 'tersedia', NULL),
  (3, 'Dock 3', 'tersedia', NULL),
  (4, 'Dock 4', 'tersedia', NULL);

-- Slot waktu hari ini dan tiga hari ke depan, 07.00 sampai 16.00, satu jam per slot, kuota 4.
-- Slot 12.00 sampai 13.00 nonaktif untuk istirahat.
INSERT INTO slot_waktu (tanggal, jam_mulai, jam_selesai, kuota, status_slot)
SELECT
  DATE_ADD(CURDATE(), INTERVAL d.n DAY),
  MAKETIME(h.n, 0, 0),
  MAKETIME(h.n + 1, 0, 0),
  4,
  IF(h.n = 12, 'nonaktif', 'aktif')
FROM
  (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) d
  CROSS JOIN
  (SELECT 7 AS n UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
   UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15) h
ORDER BY d.n, h.n;
