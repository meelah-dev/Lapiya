import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  lga: text('lga').notNull(),
  trimester: text('trimester').notNull(), // '1', '2', '3'
  languagePreference: text('language_preference').notNull().default('ha'), // 'ha' | 'en'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const symptomCards = pgTable('symptom_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  symptoms: jsonb('symptoms').$type<string[]>().notNull(),
  urgency: text('urgency').notNull(), // 'low' | 'medium' | 'critical'
  actionStep: text('action_step').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  symptomCards: many(symptomCards),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const symptomCardsRelations = relations(symptomCards, ({ one }) => ({
  user: one(users, {
    fields: [symptomCards.userId],
    references: [users.id],
  }),
}));
