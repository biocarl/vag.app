import {Component, OnInit} from '@angular/core';
import {QueueService} from "../../queue.service";
import {PresenterMessage} from "../../presenter-message";
import {QrCodeService} from "../../qr-code.service";
import {GroupService} from "../../group.service";
import {LoggerService} from "../../logger.service";
import {PairPresenterSubscribeResponse} from "../pair-presenter-subscribe-response";
import {View} from "../../view";

/**
 * This interface defines the structure of the client message sent to the presenter for the "pair" interaction.
 * @interface
 */
interface CounterClientSubscribeResponse {
  participantName: string;
  interaction: string;
}

@Component({
  selector: 'app-counter-presenter',
  templateUrl: './pair-presenter.component.html',
  styleUrls: ['./pair-presenter.component.css']
})
/**
 * The pair presenter component is used to emit a pairing signal to all clients and
 * shows a QR code for quickly connecting with the appropriate channel
 * @component
 * @implements View
 */
export class PairPresenterComponent implements OnInit, View {
  connectedParticipants: number = 0;
  qrCodeUrl ?: string;
  isPublic: boolean = false;

  constructor(private queueService: QueueService, private qrCodeService: QrCodeService, private groupService : GroupService, private log: LoggerService) {}

  ngOnInit(): void {
    this.queueService.listenToClientChannel<CounterClientSubscribeResponse>(counterSubscriptionEvent => {
      if (counterSubscriptionEvent.interaction && counterSubscriptionEvent.interaction === "pair") {
        this.connectedParticipants++;
      }
      if (counterSubscriptionEvent.participantName) {
        this.log.toConsole(counterSubscriptionEvent.participantName + " is listening.")
      }
    },"PairPresenterComponent.ngOnInit");
  }

  initializeComponent(data: PresenterMessage): void {
    const presenterMessage = data as PairPresenterSubscribeResponse;
    if(presenterMessage.anonymity === "public"){
      this.isPublic = true;
    }

    let url = `https://shee.app/${this.groupService.getGroupName()}`;

    this.qrCodeService.generateQrCode(url).then(url => {
      this.qrCodeUrl = url;
    });
  }
}
