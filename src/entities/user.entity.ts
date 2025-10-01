import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Role } from "./enums";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string; 

  @Column({ type: "enum", enum: Role })
  role!: Role;

  @Column({ type: "varchar", nullable: true, default: null })
  recorderId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  createdBy!: number;

  @ManyToOne(() => User, (user) => user.createdUsers, { nullable: true })
  creator!: User;

  @OneToMany(() => User, (user) => user.creator)
  createdUsers!: User[];
}
