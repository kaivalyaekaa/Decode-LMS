package com.ekaa.registration.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;

    @Column(name = "connected_with")
    private String connectedWith;

    @Column(name = "selected_trainings", columnDefinition = "TEXT")
    private String selectedTrainings;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getConnectedWith() {
        return connectedWith;
    }

    public void setConnectedWith(String connectedWith) {
        this.connectedWith = connectedWith;
    }

    public String getSelectedTrainings() {
        return selectedTrainings;
    }

    public void setSelectedTrainings(String selectedTrainings) {
        this.selectedTrainings = selectedTrainings;
    }
}
