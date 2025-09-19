-- Add foreign key constraints to establish proper relationships

-- Add foreign key from messages.user_id to profiles.id
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from messages.room_id to chat_rooms.id
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_room_id 
FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Add foreign key from chat_rooms.created_by to profiles.id
ALTER TABLE chat_rooms 
ADD CONSTRAINT fk_chat_rooms_created_by 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add foreign key from room_members.user_id to profiles.id
ALTER TABLE room_members 
ADD CONSTRAINT fk_room_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from room_members.room_id to chat_rooms.id
ALTER TABLE room_members 
ADD CONSTRAINT fk_room_members_room_id 
FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Add foreign key from activity_logs.user_id to profiles.id
ALTER TABLE activity_logs 
ADD CONSTRAINT fk_activity_logs_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from violations.user_id to profiles.id
ALTER TABLE violations 
ADD CONSTRAINT fk_violations_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from violations.message_id to messages.id
ALTER TABLE violations 
ADD CONSTRAINT fk_violations_message_id 
FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- Add foreign key from warnings.user_id to profiles.id
ALTER TABLE warnings 
ADD CONSTRAINT fk_warnings_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from warnings.violation_id to violations.id
ALTER TABLE warnings 
ADD CONSTRAINT fk_warnings_violation_id 
FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE;

-- Add foreign key from warnings.issued_by to profiles.id
ALTER TABLE warnings 
ADD CONSTRAINT fk_warnings_issued_by 
FOREIGN KEY (issued_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add foreign key from punishments.user_id to profiles.id
ALTER TABLE punishments 
ADD CONSTRAINT fk_punishments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key from punishments.violation_id to violations.id
ALTER TABLE punishments 
ADD CONSTRAINT fk_punishments_violation_id 
FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE;

-- Add foreign key from punishments.issued_by to profiles.id
ALTER TABLE punishments 
ADD CONSTRAINT fk_punishments_issued_by 
FOREIGN KEY (issued_by) REFERENCES profiles(id) ON DELETE SET NULL;
