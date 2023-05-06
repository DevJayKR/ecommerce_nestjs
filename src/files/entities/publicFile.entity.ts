import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PublicFile {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public url: string;

  @Column()
  public key: string;
}
