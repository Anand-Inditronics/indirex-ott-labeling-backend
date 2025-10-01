import { User } from "./user.entity";
import { Device } from "./device.entity";
import { Event } from "./event.entity";
import { EventAd } from "./eventAd.entity";
import { EventChannel } from "./eventChannel.entity";
import { EventContent } from "./eventContent.entity";
import { Label } from "./label.entity";
import { LabelEvent } from "./labelEvent.entity";
import { LabelAd } from "./labelAd.entity";
import { LabelCommercial } from "./labelCommercial.entity";
import { LabelContent } from "./labelContent.entity";
import { LabelDisruptions } from "./labelDisruptions.entity";
import { LabelMovie } from "./labelMovie.entity";
import { LabelNews } from "./labelNews.entity";
import { LabelNoVideo } from "./labelNoVideo.entity";
import { LabelProgram } from "./labelProgram.entity";
import { LabelSong } from "./labelSong.entity";
import { LabelSports } from "./labelSports.entity";
import { LabelStandBy } from "./labelStandBy.entity";
import { LabelPromo } from "./labelPromo.entity";
import { LabelSpotOutsideBreak } from "./labelSpotOutSideBreak";



// Export all entities as an array for use in database.ts
export const entities = [
  User,
  Device,
  Event,
  EventAd,
  EventChannel,
  EventContent,
  Label,
  LabelEvent,
  LabelAd,
  LabelCommercial,
  LabelContent,
  LabelDisruptions,
  LabelMovie,
  LabelNews,
  LabelNoVideo,
  LabelProgram,
  LabelSong,
  LabelSports,
  LabelStandBy,
  LabelPromo,
  LabelSpotOutsideBreak
  
];
