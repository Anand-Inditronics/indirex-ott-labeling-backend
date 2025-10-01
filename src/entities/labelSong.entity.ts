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
@Index(["song_name"])
@Index(["artist"])
export class LabelSong {
  @PrimaryColumn()
  content_id!: number;

  @Column()
  song_name!: string;

  @Column({ nullable: true })
  artist!: string;

  @Column({ nullable: true })
  album!: string;

  @Column({ nullable: true })
  language!: string;

  @Column({ nullable: true })
  release_year!: number;

  @OneToOne(() => LabelContent, (content) => content.song, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "content_id" })
  content!: LabelContent;
}
