import {Column,Entity, PrimaryColumn} from "typeorm";
    
@Entity()
export class AsRun {
    @PrimaryColumn()
    id!: number;

    @Column()
    uploaded_by!: string;

    @Column({type:"timestamp"})
    uploaded_at!: Date;

    @Column()
    channel_name!: string;

    @Column()
    date!:Date;

    @Column()
    file_url!: string;

}