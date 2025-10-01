import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Label } from "./label.entity";
import { LabelAd } from "./labelAd.entity";
import { LabelSpotOutsideBreak } from "./labelSpotOutSideBreak";
import { LabelPromo } from "./labelPromo.entity";

@Entity()
@Index(["commercial_type"])
export class LabelCommercial {
  @PrimaryColumn()
  label_id!: number;

  @Column()
  commercial_type!: string;

  @Column({ nullable: true })
  duration!: number;

  @Column({ nullable: true })
  language!: string;

  @OneToOne(() => Label, (label) => label.commercial, { onDelete: "CASCADE" })
  @JoinColumn({ name: "label_id" })
  label!: Label;

  @OneToOne(() => LabelAd, (labelAd) => labelAd.commercial, {
    cascade: true,
    nullable: true,
  })
  ad!: LabelAd | null;

  @OneToOne(
    () => LabelSpotOutsideBreak,
    (labelSpotOutsideBreak) => labelSpotOutsideBreak.commercial,
    { cascade: true, nullable: true }
  )
  spotOutsideBreak!: LabelSpotOutsideBreak | null;

  @OneToOne(() => LabelPromo, (labelPromo) => labelPromo.commercial, {
    cascade: true,
    nullable: true,
  })
  promo!: LabelPromo | null;
}
