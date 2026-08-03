import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [MatCard, MatCardContent, MatButton, MatIcon, TranslatePipe],
})
export class LoginComponent implements OnInit {
  private returnUrl: string;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/kicker';
  }

  loginWithMS() {
    this.authService.loginWithMicrosoft();
  }
}
