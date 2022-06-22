import type { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import type { FormBuilder } from '@angular/forms';
import type { ActivatedRoute } from '@angular/router';
import type { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams.returnUrl || '/dashboard';
  }

  loginWithMS() {
    this.authService.loginWithMicrosoft();
  }
}
