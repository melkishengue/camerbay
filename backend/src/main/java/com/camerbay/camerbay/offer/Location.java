package com.camerbay.camerbay.offer;

import java.util.Objects;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Slf4j
public class Location {
  @Column(name = "city", length = 100)
  private String city;

  @Column(name = "address", length = 100)
  private String address;

  @Column(name = "latitude", length = 100)
  private double latitude;

  @Column(name = "longitude", length = 100)
  private double longitude;

  @Column(name = "location", columnDefinition = "geography(Point, 4326)")
  private Point coordinates;

  private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

  public static Location of(String city, String address, double latitude, double longitude) {
    Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
    return new Location(city, address, latitude, longitude, point);
  }

  public void updateCoordinates(double longitude, double latitude) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.coordinates = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
  }

  public void update(LocationRequest location) {
    log.info("Updating locaton {}", location);
    if (location.city() != null && !location.city().isBlank()) {
      this.city = location.city();
    }
    this.updateCoordinates(location.longitude(), location.latitude());

    if (location.address() != null && !location.address().isBlank()) {
      this.address = location.address();
    }
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof Location that))
      return false;
    return Double.compare(that.latitude, latitude) == 0 &&
        Double.compare(that.longitude, longitude) == 0 &&
        Objects.equals(city, that.city) &&
        Objects.equals(address, that.address);
  }

  @Override
  public int hashCode() {
    return Objects.hash(city);
  }
}