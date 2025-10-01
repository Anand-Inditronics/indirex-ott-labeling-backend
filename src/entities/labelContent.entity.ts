import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Label } from "./label.entity";
import { LabelProgram } from "./labelProgram.entity";
import { LabelMovie } from "./labelMovie.entity";
import { LabelSong } from "./labelSong.entity";
import { LabelSports } from "./labelSports.entity";
import { LabelNews } from "./labelNews.entity";

@Entity()
@Index(["content_type"])
export class LabelContent {
  @PrimaryColumn()
  label_id!: number;

  @Column()
  content_type!: string;

  @Column({ nullable: true })
  genre!: string;

  @Column({ nullable: true })
  language!: string;

  @OneToOne(() => Label, (label) => label.content, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @OneToOne(() => LabelProgram, (labelProgram) => labelProgram.content, {
    cascade: true,
    nullable: true,
  })
  program!: LabelProgram | null;

  @OneToOne(() => LabelMovie, (labelMovie) => labelMovie.content, {
    cascade: true,
    nullable: true,
  })
  movie!: LabelMovie | null;

  @OneToOne(() => LabelSong, (labelSong) => labelSong.content, {
    cascade: true,
    nullable: true,
  })
  song!: LabelSong | null;

  @OneToOne(() => LabelSports, (labelSports) => labelSports.content, {
    cascade: true,
    nullable: true,
  })
  sports!: LabelSports | null;

  @OneToOne(() => LabelNews, (labelNews) => labelNews.content, {
    cascade: true,
    nullable: true,
  })
  news!: LabelNews | null;
}
