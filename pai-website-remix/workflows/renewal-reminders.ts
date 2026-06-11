import { query } from "../app/lib/db.server";
import {
  sendRenewalReminder15DaysBefore,
  sendRenewalReminder2DaysBefore,
  sendRenewalReminder3DaysAfter,
  sendRenewalReminder15DaysAfter,
  sendRenewalReminder30DaysAfter,
} from "../app/lib/email.server";

interface MemberForReminder {
  id: number;
  name: string;
  email: string;
  membership_type: string;
  active_until: string;
}

const SITE_URL = process.env.SITE_URL || "https://pgaoi.org";
const RENEW_LINK = `${SITE_URL}/renew-membership`;

async function fetchMembers(sql: string): Promise<MemberForReminder[]> {
  return query<MemberForReminder>(sql);
}

export async function sendRenewalReminders(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running renewal reminders workflow...`);

  const checkpoints: Array<{
    label: string;
    sql: string;
    send: (data: { userName: string; userEmail: string; expiryDate: string; membershipType: string; renewLink: string }) => Promise<void>;
  }> = [
    {
      label: "E1 — 15 days before",
      sql: `SELECT id, name, email, membership_type, active_until
            FROM members
            WHERE DATE(active_until) = DATE(CURDATE() + INTERVAL 15 DAY)
              AND is_life_member = 0
              AND membership_status != 'inactive'`,
      send: sendRenewalReminder15DaysBefore,
    },
    {
      label: "E2 — 2 days before",
      sql: `SELECT id, name, email, membership_type, active_until
            FROM members
            WHERE DATE(active_until) = DATE(CURDATE() + INTERVAL 2 DAY)
              AND is_life_member = 0
              AND membership_status != 'inactive'`,
      send: sendRenewalReminder2DaysBefore,
    },
    {
      label: "E3 — 3 days after",
      sql: `SELECT id, name, email, membership_type, active_until
            FROM members
            WHERE DATE(active_until) = DATE(CURDATE() - INTERVAL 3 DAY)
              AND is_life_member = 0`,
      send: sendRenewalReminder3DaysAfter,
    },
    {
      label: "E4 — 15 days after",
      sql: `SELECT id, name, email, membership_type, active_until
            FROM members
            WHERE DATE(active_until) = DATE(CURDATE() - INTERVAL 15 DAY)
              AND is_life_member = 0`,
      send: sendRenewalReminder15DaysAfter,
    },
    {
      label: "E5 — 30 days after (final)",
      sql: `SELECT id, name, email, membership_type, active_until
            FROM members
            WHERE DATE(active_until) = DATE(CURDATE() - INTERVAL 30 DAY)
              AND is_life_member = 0`,
      send: sendRenewalReminder30DaysAfter,
    },
  ];

  let totalSent = 0;

  for (const checkpoint of checkpoints) {
    try {
      const members = await fetchMembers(checkpoint.sql);

      if (members.length === 0) {
        console.log(`  ${checkpoint.label}: no members matched`);
        continue;
      }

      console.log(`  ${checkpoint.label}: ${members.length} member(s) matched`);

      for (const member of members) {
        try {
          await checkpoint.send({
            userName: member.name,
            userEmail: member.email,
            expiryDate: member.active_until,
            membershipType: member.membership_type,
            renewLink: RENEW_LINK,
          });
          totalSent++;
        } catch (err) {
          console.error(`  Failed to send ${checkpoint.label} to ${member.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`  Error processing ${checkpoint.label}:`, err);
    }
  }

  console.log(`[${new Date().toISOString()}] Renewal reminders complete — ${totalSent} email(s) sent.`);
}
