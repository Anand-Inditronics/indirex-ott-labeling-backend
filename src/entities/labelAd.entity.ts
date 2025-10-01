import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LabelCommercial } from "./labelCommercial.entity";
import { AdType } from "./enums";

@Entity()
@Index(["brand"])
@Index(["type"])
export class LabelAd {
  @PrimaryColumn()
  commercial_id!: number;

  @Column({ nullable: true })
  type!: string;

  @Column({ nullable: true })
  brand!: string;

  @Column({ nullable: true })
  product!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({ nullable: true })
  sector!: string;

  @Column({ nullable: true })
  format!: string;

  @Column({ nullable: true })
  title!: string;

  @Column({ nullable: true })
  language!: string;

  @OneToOne(() => LabelCommercial, (commercial) => commercial.ad, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "commercial_id" })
  commercial!: LabelCommercial;
}
