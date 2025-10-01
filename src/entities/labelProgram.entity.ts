import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelContent } from "./labelContent.entity";

@Entity()
@Index(["program_name"])
@Index(["genre"])
export class LabelProgram {
  @PrimaryColumn()
  content_id!: number;

  @Column()
  program_name!: string;

  @Column({ nullable: true })
  genre!: string;

  @Column({ nullable: true })
  episode_number!: number;

  @Column({ nullable: true })
  season_number!: number;

  @Column({ nullable: true })
  language!: string;

  @OneToOne(() => LabelContent, (content) => content.program, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "content_id" })
  content!: LabelContent;
}
