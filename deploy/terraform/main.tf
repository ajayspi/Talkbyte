terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  region = var.oci_region
}

# Compute Instance (VM.Standard.A1.Flex — Free tier eligible, ARM-based)
resource "oci_core_instance" "talkbyte_backend" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "talkbyte-backend"
  shape               = "VM.Standard.A1.Flex"
  shape_config {
    memory_in_gbs = 12
    ocpus         = 2
  }

  create_vnic_details {
    subnet_id = oci_core_subnet.talkbyte_subnet.id
  }

  source_details {
    source_type = "IMAGE"
    image_id    = data.oci_core_images.ubuntu.images[0].id
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = base64encode(file("${path.module}/../init-backend.sh"))
  }
}

# VCN (Virtual Cloud Network)
resource "oci_core_vcn" "talkbyte_vcn" {
  display_name   = "talkbyte-vcn"
  compartment_id = var.compartment_id
  cidr_block     = "10.0.0.0/16"
}

# Subnet
resource "oci_core_subnet" "talkbyte_subnet" {
  display_name      = "talkbyte-subnet"
  vcn_id            = oci_core_vcn.talkbyte_vcn.id
  compartment_id    = var.compartment_id
  cidr_block        = "10.0.1.0/24"
  route_table_id    = oci_core_route_table.talkbyte_route_table.id
  security_list_ids = [oci_core_security_list.talkbyte_security_list.id]
}

# Internet Gateway
resource "oci_core_internet_gateway" "talkbyte_igw" {
  display_name   = "talkbyte-igw"
  vcn_id         = oci_core_vcn.talkbyte_vcn.id
  compartment_id = var.compartment_id
  enabled        = true
}

# Route Table
resource "oci_core_route_table" "talkbyte_route_table" {
  display_name   = "talkbyte-route-table"
  vcn_id         = oci_core_vcn.talkbyte_vcn.id
  compartment_id = var.compartment_id
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.talkbyte_igw.id
  }
}

# Security List (Firewall rules)
resource "oci_core_security_list" "talkbyte_security_list" {
  display_name   = "talkbyte-security-list"
  vcn_id         = oci_core_vcn.talkbyte_vcn.id
  compartment_id = var.compartment_id

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 8000
      max = 8000
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

# Data source for availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

# Data source for Ubuntu image (latest)
data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  state                    = "AVAILABLE"
}
